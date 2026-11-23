from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_optional_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewResponse
from app.services.review_service import ReviewService

router = APIRouter(prefix="/products", tags=["Reviews"])


@router.post(
    "/{id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a product review (Guest or Authenticated)",
)
def create_product_review(
    id: int,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """Product par review dein (Authenticated user ya Guest visitor)"""
    return ReviewService.create_review(
        db, user=current_user, product_id=id, data=data
    )


@router.get(
    "/{id}/reviews",
    response_model=List[ReviewResponse],
    status_code=status.HTTP_200_OK,
    summary="List all reviews for a product (Public)",
)
def list_product_reviews(
    id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Product ke tamam reviews dekhain (Public)"""
    return ReviewService.list_reviews(
        db, product_id=id, skip=skip, limit=limit
    )
