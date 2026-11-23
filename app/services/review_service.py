from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.repositories.review_repository import ReviewRepository
from app.schemas.review import ReviewCreate, ReviewResponse


class ReviewService:
    @staticmethod
    def create_review(
        db: Session,
        user: Optional[User],
        product_id: int,
        data: ReviewCreate,
    ) -> ReviewResponse:
        # 1. Product check
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        # 2. Authenticated user vs Guest handling
        is_verified_purchase = False
        user_id: Optional[int] = None
        reviewer_name: str = ""
        guest_name: Optional[str] = None

        if user:
            # 2a. Duplicate Review Check for authenticated user
            existing_review = ReviewRepository.get_user_review(
                db, user_id=user.id, product_id=product_id
            )
            if existing_review:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="You have already reviewed this product",
                )
            user_id = user.id
            reviewer_name = user.name
            # Check if this buyer has a delivered purchase for this product
            is_verified_purchase = ReviewRepository.has_delivered_purchase(
                db, user_id=user.id, product_id=product_id
            )
        else:
            # 2b. Guest user: require valid name
            raw_name = data.guest_name.strip() if data.guest_name else ""
            if not raw_name or len(raw_name) < 2:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Please enter your name (at least 2 characters)",
                )
            guest_name = raw_name
            reviewer_name = raw_name
            is_verified_purchase = False

        # 3. Comment validation
        comment = data.comment.strip() if data.comment else ""
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Review comment cannot be empty",
            )

        # 4. Review Create
        review = ReviewRepository.create(
            db,
            user_id=user_id,
            guest_name=guest_name,
            product_id=product_id,
            rating=data.rating,
            comment=comment,
            is_verified_purchase=is_verified_purchase,
        )

        return ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            user_name=reviewer_name,
            product_id=product_id,
            rating=review.rating,
            comment=review.comment,
            is_verified_purchase=review.is_verified_purchase,
            created_at=review.created_at,
        )

    @staticmethod
    def list_reviews(
        db: Session,
        product_id: int,
        skip: int = 0,
        limit: int = 20,
    ) -> List[ReviewResponse]:
        # Fast indexed check: does active product exist without loading images & sizes
        exists = db.scalar(
            select(Product.id).where(
                Product.id == product_id,
                Product.is_active.is_(True),
            )
        )
        if not exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        reviews = ReviewRepository.list_by_product(
            db, product_id=product_id, skip=skip, limit=limit
        )

        return [
            ReviewResponse(
                id=r.id,
                user_id=r.user_id,
                user_name=r.user.name if r.user else (r.guest_name or "Guest"),
                product_id=r.product_id,
                rating=r.rating,
                comment=r.comment,
                is_verified_purchase=r.is_verified_purchase,
                created_at=r.created_at,
            )
            for r in reviews
        ]
