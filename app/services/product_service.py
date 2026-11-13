from decimal import Decimal
from typing import Optional, Sequence
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    @staticmethod
    def create(db: Session, data: ProductCreate) -> Product:
        category = CategoryRepository.get_by_id(db, category_id=data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category_id: Category does not exist",
            )
        return ProductRepository.create(db, data)

    @staticmethod
    def get_active(db: Session, product_id: int) -> Product:
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        return product

    @staticmethod
    def list_active(
        db: Session,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Product]:
        return ProductRepository.list_active(
            db,
            category_id=category_id,
            search=search,
            min_price=min_price,
            max_price=max_price,
            skip=skip,
            limit=limit,
        )

    @staticmethod
    def list_admin(
        db: Session,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Product]:
        return ProductRepository.list_all_admin(
            db,
            category_id=category_id,
            search=search,
            min_price=min_price,
            max_price=max_price,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )

    @staticmethod
    def update(db: Session, product_id: int, data: ProductUpdate) -> Product:
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        if data.category_id is not None:
            category = CategoryRepository.get_by_id(
                db, category_id=data.category_id
            )
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category_id: Category does not exist",
                )

        return ProductRepository.update(db, product=product, data=data)

    @staticmethod
    def delete(db: Session, product_id: int) -> Product:
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        return ProductRepository.soft_delete(db, product=product)

