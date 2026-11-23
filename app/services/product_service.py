from decimal import Decimal
from typing import Optional, Sequence
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.review_repository import ReviewRepository
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
        avg_rating, count = ReviewRepository.get_stats(db, product_id=product.id)
        setattr(product, "average_rating", avg_rating)
        setattr(product, "review_count", count)
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
        products = ProductRepository.list_active(
            db,
            category_id=category_id,
            search=search,
            min_price=min_price,
            max_price=max_price,
            skip=skip,
            limit=limit,
        )
        for p in products:
            avg_rating, count = ReviewRepository.get_stats(db, product_id=p.id)
            setattr(p, "average_rating", avg_rating)
            setattr(p, "review_count", count)
        return products

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
        products = ProductRepository.list_all_admin(
            db,
            category_id=category_id,
            search=search,
            min_price=min_price,
            max_price=max_price,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )
        for p in products:
            avg_rating, count = ReviewRepository.get_stats(db, product_id=p.id)
            setattr(p, "average_rating", avg_rating)
            setattr(p, "review_count", count)
        return products

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

        # Cross-validation between existing/updated price and sale_price
        new_price = data.price if data.price is not None else product.price
        new_sale_price = data.sale_price if data.sale_price is not None else product.sale_price
        if new_sale_price is not None and new_price is not None and new_sale_price >= new_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sale price must be less than normal price",
            )

        return ProductRepository.update(db, product=product, data=data)

    @staticmethod
    def get_effective_price(product: Product, size: Optional[str] = None) -> tuple[Decimal, Optional[Decimal]]:
        """
        Returns (effective_selling_price, original_price).
        If size is provided and that size has its own price, size pricing is used.
        Otherwise falls back to product.sale_price / product.price.
        """
        if size and product.has_sizes and product.sizes:
            clean_sz = size.strip().lower()
            size_obj = next((s for s in product.sizes if s.size.strip().lower() == clean_sz), None)
            if size_obj and size_obj.price is not None:
                norm_price = Decimal(str(size_obj.price))
                sale_price = Decimal(str(size_obj.sale_price)) if size_obj.sale_price is not None else None
                selling_price = sale_price if sale_price is not None else norm_price
                return (selling_price, norm_price if sale_price is not None else None)

        norm_price = Decimal(str(product.price))
        sale_price = Decimal(str(product.sale_price)) if product.sale_price is not None else None
        selling_price = sale_price if sale_price is not None else norm_price
        return (selling_price, norm_price if sale_price is not None else None)

    @staticmethod
    def delete(db: Session, product_id: int) -> Product:
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )
        return ProductRepository.soft_delete(db, product=product)
