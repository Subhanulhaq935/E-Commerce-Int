from datetime import datetime, timezone
from decimal import Decimal
import secrets
from typing import Any, Dict, Optional, Sequence, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.order import Order
from app.models.product import Product
from app.models.product_size import ProductSize
from app.models.user import User
from app.repositories.address_repository import AddressRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.order import CheckoutRequest, GuestCheckoutRequest
from app.services.email_service import EmailService
from app.services.product_service import ProductService


class OrderService:
    @staticmethod
    def checkout(
        db: Session,
        user_id: int,
        data: CheckoutRequest,
        background_tasks: Any = None,
    ) -> Order:
        # 1. Cart load and check (Pehle cart check karein)
        cart = CartRepository.get_or_create_cart(db, user_id=user_id)
        if not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        # 2. Address / Customer delivery details check
        address = None
        if data.shipping_address_id is not None:
            address = AddressRepository.get_by_id_and_user(
                db, address_id=data.shipping_address_id, user_id=user_id
            )
            if not address:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid address",
                )
        else:
            required_fields = [
                data.guest_name,
                data.guest_email,
                data.guest_phone,
                data.guest_address,
                data.guest_city,
            ]
            if any(not f or not str(f).strip() for f in required_fields):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Please provide a shipping address or fill in all required customer delivery details (Name, Email, Phone, Address, City).",
                )

        try:
            # 3. Product IDs ko ascending order mein sort karein (Deadlock prevention)
            product_ids = sorted([item.product_id for item in cart.items])

            # Row lock: SELECT ... FOR UPDATE (Product & ProductSize for strict concurrency & race condition protection)
            locked_products = db.scalars(
                select(Product)
                .options(selectinload(Product.sizes))
                .where(Product.id.in_(product_ids))
                .order_by(Product.id.asc())
                .with_for_update()
            ).all()

            db.scalars(
                select(ProductSize)
                .where(ProductSize.product_id.in_(product_ids))
                .order_by(ProductSize.id.asc())
                .with_for_update()
            ).all()

            products_by_id: Dict[int, Product] = {p.id: p for p in locked_products}

            # Aggregate requested quantities per item (product_id, size) and per product_id
            requested_by_item: Dict[Tuple[int, Optional[str]], int] = {}
            requested_by_product: Dict[int, int] = {}
            for item in cart.items:
                clean_sz = item.size.strip().lower() if item.size else None
                key = (item.product_id, clean_sz)
                requested_by_item[key] = requested_by_item.get(key, 0) + item.quantity
                requested_by_product[item.product_id] = requested_by_product.get(item.product_id, 0) + item.quantity

            # 4. Active status & Stock check for each item
            for item in cart.items:
                product = products_by_id.get(item.product_id)
                if not product or not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Product is not active",
                    )
                clean_size = item.size.strip().lower() if item.size else None
                total_item_qty = requested_by_item.get((item.product_id, clean_size), item.quantity)
                total_prod_qty = requested_by_product.get(item.product_id, item.quantity)

                if product.has_sizes:
                    if not item.size:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Size selection is required for '{product.name}'",
                        )
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
                    if size_variant.stock <= 0:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'{product.name}' (Size: {item.size}) is currently out of stock",
                        )
                    if total_item_qty > size_variant.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' (Size: {item.size}) exceeds available stock ({size_variant.stock}). Only {size_variant.stock} items are currently available in stock.",
                        )
                else:
                    if product.stock <= 0:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'{product.name}' is currently out of stock",
                        )
                    if total_prod_qty > product.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' exceeds available stock ({product.stock}). Only {product.stock} items are currently available in stock.",
                        )

            # 5. Total calculation (DB prices se, client se nahi - using effective size/sale price)
            subtotal_sum = Decimal("0.00")
            for item in cart.items:
                product = products_by_id[item.product_id]
                effective_price, _ = ProductService.get_effective_price(product, item.size)
                subtotal_sum += effective_price * item.quantity

            delivery_charge = Decimal(str(settings.DELIVERY_CHARGE))
            grand_total = subtotal_sum + delivery_charge

            # 6. Generate cryptographically secure tracking token (32 bytes urlsafe = 43 chars)
            tracking_token = secrets.token_urlsafe(32)

            # Create Order
            order = OrderRepository.create_order(
                db,
                buyer_id=user_id,
                shipping_address_id=address.id if address else None,
                total_amount=grand_total,
                guest_name=data.guest_name.strip() if not address and data.guest_name else None,
                guest_email=str(data.guest_email).strip() if not address and data.guest_email else None,
                guest_phone=data.guest_phone.strip() if not address and data.guest_phone else None,
                guest_address=data.guest_address.strip() if not address and data.guest_address else None,
                guest_city=data.guest_city.strip() if not address and data.guest_city else None,
                guest_postal_code=data.guest_postal_code.strip() if not address and data.guest_postal_code else None,
                tracking_token=tracking_token,
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
            refreshed_order = OrderRepository.get_order_by_id(db, order_id=order.id)

            # 11. Automatically send confirmation email asynchronously (Instant UI response)
            if refreshed_order:
                if background_tasks:
                    background_tasks.add_task(EmailService.send_order_confirmation, refreshed_order)
                else:
                    import threading
                    threading.Thread(
                        target=EmailService.send_order_confirmation,
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

            # Row lock: SELECT ... FOR UPDATE (Product & ProductSize for strict concurrency & race condition protection)
            locked_products = db.scalars(
                select(Product)
                .options(selectinload(Product.sizes))
                .where(Product.id.in_(product_ids))
                .order_by(Product.id.asc())
                .with_for_update()
            ).all()

            db.scalars(
                select(ProductSize)
                .where(ProductSize.product_id.in_(product_ids))
                .order_by(ProductSize.id.asc())
                .with_for_update()
            ).all()

            products_by_id: Dict[int, Product] = {p.id: p for p in locked_products}

            # Aggregate requested quantities per item (product_id, size) and per product_id
            requested_by_item: Dict[Tuple[int, Optional[str]], int] = {}
            requested_by_product: Dict[int, int] = {}
            for item in data.items:
                clean_sz = item.size.strip().lower() if item.size else None
                key = (item.product_id, clean_sz)
                requested_by_item[key] = requested_by_item.get(key, 0) + item.quantity
                requested_by_product[item.product_id] = requested_by_product.get(item.product_id, 0) + item.quantity

            # 2. Active status & Stock check for each item
            for item in data.items:
                product = products_by_id.get(item.product_id)
                if not product or not product.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Product #{item.product_id} is not active",
                    )
                clean_size = item.size.strip().lower() if item.size else None
                total_item_qty = requested_by_item.get((item.product_id, clean_size), item.quantity)
                total_prod_qty = requested_by_product.get(item.product_id, item.quantity)

                if product.has_sizes:
                    if not item.size:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Size selection is required for '{product.name}'",
                        )
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
                    if size_variant.stock <= 0:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'{product.name}' (Size: {item.size}) is currently out of stock",
                        )
                    if total_item_qty > size_variant.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' (Size: {item.size}) exceeds available stock ({size_variant.stock}). Only {size_variant.stock} items are currently available in stock.",
                        )
                else:
                    if product.stock <= 0:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"'{product.name}' is currently out of stock",
                        )
                    if total_prod_qty > product.stock:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Requested quantity for '{product.name}' exceeds available stock ({product.stock}). Only {product.stock} items are currently available in stock.",
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
        db: Session,
        order_id: int,
        new_status: OrderStatus,
        background_tasks: Any = None,
    ) -> Order:
        # Lock order row to prevent concurrent status transition race conditions
        order = db.scalar(
            select(Order)
            .options(
                selectinload(Order.items),
                selectinload(Order.payment),
                selectinload(Order.shipping_address),
                selectinload(Order.buyer),
            )
            .where(Order.id == order_id)
            .with_for_update()
        )
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

        old_status = order.status

        # Status update
        order.status = new_status

        # Auto Payment Completion on Delivery
        if new_status == OrderStatus.delivered and order.payment:
            order.payment.status = PaymentStatus.completed
            order.payment.paid_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(order)
        refreshed_order = OrderRepository.get_order_by_id(db, order_id=order.id)

        # Dispatch status update email asynchronously
        if refreshed_order and old_status != new_status:
            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_order_status_update,
                    refreshed_order,
                    new_status=new_status,
                    old_status=old_status,
                )
            else:
                import threading
                threading.Thread(
                    target=EmailService.send_order_status_update,
                    args=(refreshed_order, new_status, old_status),
                    daemon=True,
                ).start()

        return refreshed_order
