from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    @staticmethod
    def create(db: Session, data: CategoryCreate) -> Category:
        existing = CategoryRepository.get_by_name(db, name=data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category already exists",
            )
        return CategoryRepository.create(
            db, name=data.name, description=data.description
        )

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Category:
        category = CategoryRepository.get_by_id(db, category_id=category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )
        return category

    @staticmethod
    def list_all(
        db: Session, skip: int = 0, limit: int = 100
    ) -> Sequence[Category]:
        return CategoryRepository.list_all(db, skip=skip, limit=limit)

    @staticmethod
    def update(
        db: Session, category_id: int, data: CategoryUpdate
    ) -> Category:
        category = CategoryService.get_by_id(db, category_id=category_id)

        if data.name is not None and data.name != category.name:
            existing = CategoryRepository.get_by_name(db, name=data.name)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Category with this name already exists",
                )

        return CategoryRepository.update(
            db,
            category=category,
            name=data.name,
            description=data.description,
        )

    @staticmethod
    def delete(db: Session, category_id: int) -> dict[str, str]:
        category = CategoryService.get_by_id(db, category_id=category_id)

        # Business Rule: Agar category mein products hon to delete block (400)
        has_products = db.scalar(
            select(Product.id).where(Product.category_id == category_id).limit(1)
        )
        if has_products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category has products",
            )

        CategoryRepository.delete(db, category=category)
        return {"message": "Category deleted"}

