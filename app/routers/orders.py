from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_buyer
from app.models.user import User
from app.schemas.order import CheckoutRequest, GuestCheckoutRequest, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer),
):
    """Cart checkout karein aur single-vendor COD order create karein (Registered Buyer only)"""
    return OrderService.checkout(db, user_id=current_user.id, data=data)


@router.post(
    "/guest",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place order as guest customer without login or registration",
)
def guest_checkout(
    data: GuestCheckoutRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Guest checkout (Full Name, Email, Phone, Shipping Address, Items list)"""
    return OrderService.guest_checkout(db, data=data, background_tasks=background_tasks)


@router.get(
    "/track/{tracking_token}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Track order details using secure tracking token (No auth required)",
)
def track_order(
    tracking_token: str,
    db: Session = Depends(get_db),
):
    """Publicly track guest order status, delivery progress, and items via secure token"""
    return OrderService.get_order_by_tracking_token(db, token=tracking_token)


@router.get("/my-orders", response_model=List[OrderResponse])
def get_my_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer),
):
    """Apne tamam orders ki history dekhain (Buyer only)"""
    return OrderService.get_buyer_orders(
        db, buyer_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/{id}", response_model=OrderResponse)
def get_order_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Order details dekhain (Buyer apna dekh sakta hai, Admin sab ka)"""
    return OrderService.get_order_detail(db, current_user=current_user, order_id=id)
