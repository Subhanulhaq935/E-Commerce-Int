from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/", response_model=CartResponse)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apna cart aur us ke items dekhain (Authenticated user)"""
    return CartService.get_cart(db, user_id=current_user.id)


@router.post("/items", response_model=CartResponse)
def add_to_cart(
    data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cart mein item add karein with strict stock validation (Authenticated user)"""
    return CartService.add_item(db, user_id=current_user.id, data=data)


@router.patch("/items/{id}", response_model=CartResponse)
def update_cart_item(
    id: int,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cart item ki quantity update karein with stock check (Authenticated user)"""
    return CartService.update_item_quantity(
        db, user_id=current_user.id, item_id=id, data=data
    )


@router.delete("/items/{id}", response_model=CartResponse)
def remove_from_cart(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cart se item remove karein (Authenticated user)"""
    return CartService.remove_item(db, user_id=current_user.id, item_id=id)
