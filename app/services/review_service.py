from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.product_repository import ProductRepository
from app.repositories.review_repository import ReviewRepository
from app.schemas.review import ReviewCreate, ReviewResponse


class ReviewService:
    @staticmethod
    def create_review(
        db: Session,
        user: User,
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

        # 2. Duplicate Review Check
        existing_review = ReviewRepository.get_user_review(
            db, user_id=user.id, product_id=product_id
        )
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already reviewed this product",
            )

        # 3. Verified Purchase Check (Must be in a delivered order)
        has_purchased = ReviewRepository.has_delivered_purchase(
            db, user_id=user.id, product_id=product_id
        )
        if not has_purchased:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review products from delivered orders",
            )

        # 4. Review Create
        review = ReviewRepository.create(
            db,
            user_id=user.id,
            product_id=product_id,
            rating=data.rating,
            comment=data.comment,
        )

        return ReviewResponse(
            id=review.id,
            user_id=user.id,
            user_name=user.name,
            product_id=product_id,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
        )

    @staticmethod
    def list_reviews(
        db: Session,
        product_id: int,
        skip: int = 0,
        limit: int = 20,
    ) -> List[ReviewResponse]:
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product or not product.is_active:
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
                user_name=r.user.name if r.user else "Anonymous",
                product_id=r.product_id,
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
            )
            for r in reviews
        ]
