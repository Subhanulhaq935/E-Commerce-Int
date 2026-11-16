from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.payment import PaymentResponse
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/{id}", response_model=PaymentResponse)
def get_payment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Payment details dekhain (Buyer apne order ki, Admin sab ki)"""
    return PaymentService.get_payment_by_id(
        db, current_user=current_user, payment_id=id
    )
