from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Optional, Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.repositories.address_repository import AddressRepository
from app.repositories.cart_repository import CartRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.order import CheckoutRequest


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
                if item.quantity > product.stock:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Requested quantity is not available in stock",
                    )

            # 5. Total calculation (DB prices se, client se nahi)
            subtotal_sum = Decimal("0.00")
            for item in cart.items:
                product = products_by_id[item.product_id]
                unit_price = Decimal(str(product.price))
                subtotal_sum += unit_price * item.quantity

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
                unit_price = Decimal(str(product.price))
                item_subtotal = unit_price * item.quantity

                OrderRepository.create_order_item(
                    db,
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    subtotal=item_subtotal,
                )

                # Stock deduction
                product.stock -= item.quantity

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
