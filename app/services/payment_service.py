from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import UserRole
from app.models.payment import Payment
from app.models.user import User


class PaymentService:
    @staticmethod
    def get_payment_by_id(
        db: Session, current_user: User, payment_id: int
    ) -> Payment:
        payment = db.scalar(
            select(Payment)
            .options(selectinload(Payment.order))
            .where(Payment.id == payment_id)
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )

        # Buyer Isolation Check
        if current_user.role == UserRole.buyer:
            if payment.order.buyer_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this payment",
                )

        return payment
