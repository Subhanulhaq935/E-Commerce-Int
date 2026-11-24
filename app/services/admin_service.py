from typing import Any, Optional, Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus, PaymentStatus, UserRole
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.repositories.order_repository import OrderRepository
from app.repositories.user_repository import UserRepository
from app.services.email_service import EmailService


class AdminService:
    @staticmethod
    def cancel_order(
        db: Session, order_id: int, background_tasks: Any = None
    ) -> Order:
        order = OrderRepository.get_order_by_id(db, order_id=order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        # Agar order delivered ya pehle se cancelled ho to cancel block karein
        if order.status in (OrderStatus.delivered, OrderStatus.cancelled):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel an order that is already {order.status.value}",
            )

        old_status = order.status

        # Status update to cancelled
        order.status = OrderStatus.cancelled

        # Payment status update to cancelled
        if order.payment:
            order.payment.status = PaymentStatus.cancelled
            order.payment.paid_at = None

        # Stock restore karein (Har product aur size ka stock wapas add karein)
        for item in order.items:
            product = db.scalar(
                select(Product)
                .options(selectinload(Product.sizes))
                .where(Product.id == item.product_id)
            )
            if product:
                product.stock += item.quantity
                if product.has_sizes and item.size:
                    clean_size = item.size.strip().lower()
                    size_variant = next(
                        (s for s in product.sizes if s.size.strip().lower() == clean_size),
                        None,
                    )
                    if size_variant:
                        size_variant.stock += item.quantity

        db.commit()
        refreshed_order = OrderRepository.get_order_by_id(db, order_id=order.id)

        # Dispatch status update email asynchronously
        if refreshed_order and old_status != OrderStatus.cancelled:
            if background_tasks:
                background_tasks.add_task(
                    EmailService.send_order_status_update,
                    refreshed_order,
                    new_status=OrderStatus.cancelled,
                    old_status=old_status,
                )
            else:
                import threading
                threading.Thread(
                    target=EmailService.send_order_status_update,
                    args=(refreshed_order, OrderStatus.cancelled, old_status),
                    daemon=True,
                ).start()

        return refreshed_order or order

    @staticmethod
    def list_users(
        db: Session,
        role: Optional[UserRole] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[User]:
        stmt = select(User).order_by(User.id.asc())
        if role is not None:
            stmt = stmt.where(User.role == role)
        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        stmt = stmt.offset(skip).limit(limit)
        return db.scalars(stmt).all()

    @staticmethod
    def update_user_status(
        db: Session,
        current_admin: User,
        target_user_id: int,
        is_active: bool,
    ) -> User:
        # Admin khud ko deactivate nahi kar sakta
        if current_admin.id == target_user_id and not is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate own admin account",
            )

        user = UserRepository.get_by_id(db, user_id=target_user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.is_active = is_active
        db.commit()
        db.refresh(user)
        return user
