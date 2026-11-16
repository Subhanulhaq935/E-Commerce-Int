from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_buyer
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer),
):
    """Cart checkout karein aur single-vendor COD order create karein (Buyer only)"""
    return OrderService.checkout(db, user_id=current_user.id, data=data)
