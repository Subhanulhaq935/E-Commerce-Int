from datetime import datetime, timezone
from decimal import Decimal
import secrets
from typing import Any, Dict, Optional, Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.repositories.address_repository import AddressRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.order import CheckoutRequest, GuestCheckoutRequest
from app.services.email_service import EmailService
from app.services.product_service import ProductService


class OrderService:
    @staticmethod
    def checkout(db: Session, user_id: int, data: CheckoutRequest) -> Order:
        # 1. Cart load and check (Pehle cart check karein)
        cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        # 2. Address check (Must belong to this buyer)
        address = AddressRepository.get_by_id_and_user(
            db, address_id=data.shipping_address_id, user_id=user_id
        )
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid address",
            )

        try:
            # 3. Product IDs ko ascending order mein sort karein (Deadlock prevention)
            product_ids = sorted([item.product_id for item in cart.items])

            # Row lock: SELECT ... FOR UPDATE
            locked_products = db.scalars(
                select(Product)
                .options(selectinload(Product.sizes))
                .where(Product.id.in_(product_ids))
                .order_by(Product.id.asc())
                .with_for_update()
            ).all()

            products_by_id: Dict[int, Product] = {p.id: p for p in locked_products}

            # 4. Active status & Stock check for each item
            for item in cart.items:
                product = products_by_id.get(item.product_id)
                if not product or not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Product is not active",
                    )
                if product.has_sizes:
                    if not item.size:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Size selection is required for '{product.name}'",
                        )
                    clean_size = item.size.strip().lower()
                    size_variant = next(
                        (
                            s
                            for s in product.sizes
                            if s.size.strip().lower() == clean_size and s.is_available
                        ),
                        None,
                    )
                    if not size_variant:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Size '{item.size}' for '{product.name}' is no longer available",
                        )
                    if item.quantity > size_variant.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' (Size: {item.size}) exceeds available stock ({size_variant.stock})",
                        )
                else:
                    if item.quantity > product.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' is not available in stock",
                        )

            # 5. Total calculation (DB prices se, client se nahi - using effective size/sale price)
            subtotal_sum = Decimal("0.00")
            for item in cart.items:
                product = products_by_id[item.product_id]
                effective_price, _ = ProductService.get_effective_price(product, item.size)
                subtotal_sum += effective_price * item.quantity

            delivery_charge = Decimal(str(settings.DELIVERY_CHARGE))
            grand_total = subtotal_sum + delivery_charge

            # 6. Create Order
            order = OrderRepository.create_order(
                db,
                buyer_id=user_id,
                shipping_address_id=data.shipping_address_id,
                total_amount=grand_total,
            )

            # 7. Create Order Items & Deduct Stock
            for item in cart.items:
                product = products_by_id[item.product_id]
                effective_price, _ = ProductService.get_effective_price(product, item.size)
                item_subtotal = effective_price * item.quantity

                OrderRepository.create_order_item(
                    db,
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=item.quantity,
                    unit_price=effective_price,
                    subtotal=item_subtotal,
                    size=item.size,
                )

                # Stock deduction (both overall and size variant)
                product.stock -= item.quantity
                if product.has_sizes and item.size:
                    clean_size = item.size.strip().lower()
                    size_variant = next(
                        (
                            s
                            for s in product.sizes
                            if s.size.strip().lower() == clean_size
                        ),
                        None,
                    )
                    if size_variant:
                        size_variant.stock -= item.quantity

            # 8. Create Payment (COD, pending)
            OrderRepository.create_payment(
                db,
                order_id=order.id,
                amount=grand_total,
            )

            # 9. Clear cart items (cart row intact)
            for item in list(cart.items):
                db.delete(item)

            # 10. Atomic Commit
            db.commit()

            # Return order with all relationships
            return OrderRepository.get_order_by_id(db, order_id=order.id)

        except HTTPException:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def guest_checkout(
        db: Session,
        data: GuestCheckoutRequest,
        background_tasks: Any = None,
    ) -> Order:
        """Place order for unauthenticated guest customers and dispatch confirmation email"""
        if not data.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        try:
            # 1. Product IDs ko ascending order mein sort karein (Deadlock prevention)
            product_ids = sorted([item.product_id for item in data.items])

            # Row lock: SELECT ... FOR UPDATE
            locked_products = db.scalars(
                select(Product)
                .options(selectinload(Product.sizes))
                .where(Product.id.in_(product_ids))
                .order_by(Product.id.asc())
                .with_for_update()
            ).all()

            products_by_id: Dict[int, Product] = {p.id: p for p in locked_products}

            # 2. Active status & Stock check for each item
            for item in data.items:
                product = products_by_id.get(item.product_id)
                if not product or not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product #{item.product_id} is not active",
                    )
                if product.has_sizes:
                    if not item.size:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Size selection is required for '{product.name}'",
                        )
                    clean_size = item.size.strip().lower()
                    size_variant = next(
                        (
                            s
                            for s in product.sizes
                            if s.size.strip().lower() == clean_size and s.is_available
                        ),
                        None,
                    )
                    if not size_variant:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Size '{item.size}' for '{product.name}' is no longer available",
                        )
                    if item.quantity > size_variant.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' (Size: {item.size}) exceeds available stock ({size_variant.stock})",
                        )
                else:
                    if item.quantity > product.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' exceeds available stock ({product.stock})",
                        )

            # 3. Total calculation (DB prices se calculate karein - using effective size/sale price)
            subtotal_sum = Decimal("0.00")
            for item in data.items:
                product = products_by_id[item.product_id]
                effective_price, _ = ProductService.get_effective_price(product, item.size)
                subtotal_sum += effective_price * item.quantity

            delivery_charge = Decimal(str(settings.DELIVERY_CHARGE))
            grand_total = subtotal_sum + delivery_charge

            # 4. Generate cryptographically secure tracking token (32 bytes urlsafe = 43 chars)
            tracking_token = secrets.token_urlsafe(32)

            # 5. Create Guest Order
            order = OrderRepository.create_order(
                db,
                buyer_id=None,
                shipping_address_id=None,
                total_amount=grand_total,
                guest_name=data.guest_name,
                guest_email=data.guest_email,
                guest_phone=data.guest_phone,
                guest_address=data.guest_address,
                guest_city=data.guest_city,
                guest_postal_code=data.guest_postal_code,
                tracking_token=tracking_token,
            )

            # 6. Create Order Items & Deduct Stock
            for item in data.items:
                product = products_by_id[item.product_id]
                effective_price, _ = ProductService.get_effective_price(product, item.size)
                item_subtotal = effective_price * item.quantity

                OrderRepository.create_order_item(
                    db,
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=item.quantity,
                    unit_price=effective_price,
                    subtotal=item_subtotal,
                    size=item.size,
                )

                # Stock deduction (overall and size variant)
                product.stock -= item.quantity
                if product.has_sizes and item.size:
                    clean_size = item.size.strip().lower()
                    size_variant = next(
                        (
                            s
                            for s in product.sizes
                            if s.size.strip().lower() == clean_size
                        ),
                        None,
                    )
                    if size_variant:
                        size_variant.stock -= item.quantity

            # 7. Create Payment (COD, pending)
            OrderRepository.create_payment(
                db,
                order_id=order.id,
                amount=grand_total,
            )

            # 8. Atomic Commit
            db.commit()

            # 9. Return refreshed order with all items
            refreshed_order = OrderRepository.get_order_by_id(db, order_id=order.id)

            # 10. Automatically send confirmation email asynchronously (Instant UI response)
            if refreshed_order:
                if background_tasks:
                    background_tasks.add_task(EmailService.send_guest_order_confirmation, refreshed_order)
                else:
                    import threading
                    threading.Thread(
                        target=EmailService.send_guest_order_confirmation,
                        args=(refreshed_order,),
                        daemon=True,
                    ).start()

            return refreshed_order

        except HTTPException:
            db.rollback()
            raise
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def get_order_by_tracking_token(db: Session, token: str) -> Order:
        """Public order retrieval by cryptographically secure tracking token"""
        clean_token = token.strip() if token else ""
        if not clean_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tracking token is required",
            )

        order = OrderRepository.get_by_tracking_token(db, token=clean_token)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found. The tracking link may be invalid or expired.",
            )
        return order

    @staticmethod
    def get_buyer_orders(
        db: Session, buyer_id: int, skip: int = 0, limit: int = 20
    ) -> Sequence[Order]:
        return OrderRepository.list_by_buyer(
            db, buyer_id=buyer_id, skip=skip, limit=limit
        )

    @staticmethod
    def get_order_detail(
        db: Session, current_user: User, order_id: int
    ) -> Order:
        order = OrderRepository.get_order_by_id(db, order_id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # Buyer Isolation Check (Buyer sirf apna order dekh sakta hai)
        if current_user.role == UserRole.buyer and order.buyer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this order",
            )

        return order

    @staticmethod
    def list_admin_orders(
        db: Session,
        status_filter: Optional[OrderStatus] = None,
        buyer_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Order]:
        return OrderRepository.list_all(
            db, status=status_filter, buyer_id=buyer_id, skip=skip, limit=limit
        )

    @staticmethod
    def update_order_status(
        db: Session, order_id: int, new_status: OrderStatus
    ) -> Order:
        order = OrderRepository.get_order_by_id(db, order_id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # Agar order pehle hi delivered ya cancelled ho to change block karein
        if order.status in (OrderStatus.delivered, OrderStatus.cancelled):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot change status of an order that is already {order.status.value}",
            )

        # Allowed transitions rule
        allowed_transitions = {
            OrderStatus.pending: [OrderStatus.processing],
            OrderStatus.processing: [OrderStatus.shipped],
            OrderStatus.shipped: [OrderStatus.delivered],
        }

        if new_status not in allowed_transitions.get(order.status, []):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status transition",
            )

        # Status update
        order.status = new_status

        # Auto Payment Completion on Delivery
        if new_status == OrderStatus.delivered and order.payment:
            order.payment.status = PaymentStatus.completed
            order.payment.paid_at = datetime.now(timezone.utc)

        db.commit()
        return OrderRepository.get_order_by_id(db, order_id=order.id)
