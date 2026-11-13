from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category


class CategoryRepository:
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Category]:
        return db.scalar(select(Category).where(Category.name == name))

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[Category]:
        return db.scalar(select(Category).where(Category.id == category_id))

    @staticmethod
    def list_all(
        db: Session, skip: int = 0, limit: int = 100
    ) -> Sequence[Category]:
        return db.scalars(
            select(Category).order_by(Category.id.asc()).offset(skip).limit(limit)
        ).all()

    @staticmethod
    def create(
        db: Session, name: str, description: Optional[str] = None
    ) -> Category:
        category = Category(name=name, description=description)
        db.add(category)
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def update(
        db: Session,
        category: Category,
        name: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Category:
        if name is not None:
            category.name = name
        if description is not None:
            category.description = description
        db.commit()
        db.refresh(category)
        return category

    @staticmethod
    def delete(db: Session, category: Category) -> None:
        db.delete(category)
        db.commit()

