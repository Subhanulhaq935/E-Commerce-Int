from typing import Optional, Sequence, Tuple
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.enums import OrderStatus
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.review import Review


class ReviewRepository:
    @staticmethod
    def has_delivered_purchase(
        db: Session, user_id: int, product_id: int
    ) -> bool:
        stmt = (
            select(OrderItem.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.buyer_id == user_id,
                Order.status == OrderStatus.delivered,
                OrderItem.product_id == product_id,
            )
        )
        return db.scalar(stmt) is not None

    @staticmethod
    def get_user_review(
        db: Session, user_id: int, product_id: int
    ) -> Optional[Review]:
        return db.scalar(
            select(Review).where(
                Review.user_id == user_id,
                Review.product_id == product_id,
            )
        )

    @staticmethod
    def create(
        db: Session,
        user_id: Optional[int],
        product_id: int,
        rating: int,
        comment: Optional[str] = None,
        guest_name: Optional[str] = None,
        is_verified_purchase: bool = False,
    ) -> Review:
        review = Review(
            user_id=user_id,
            guest_name=guest_name,
            product_id=product_id,
            rating=rating,
            comment=comment,
            is_verified_purchase=is_verified_purchase,
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def list_by_product(
        db: Session, product_id: int, skip: int = 0, limit: int = 20
    ) -> Sequence[Review]:
        return db.scalars(
            select(Review)
            .options(joinedload(Review.user))
            .where(Review.product_id == product_id)
            .order_by(Review.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).all()

    @staticmethod
    def get_stats(db: Session, product_id: int) -> Tuple[Optional[float], int]:
        stmt = select(
            func.avg(Review.rating), func.count(Review.id)
        ).where(Review.product_id == product_id)
        row = db.execute(stmt).first()
        if not row or row[1] == 0:
            return None, 0
        avg = round(float(row[0]), 1) if row[0] is not None else None
        return avg, int(row[1])
