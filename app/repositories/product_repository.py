from decimal import Decimal
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    @staticmethod
    def create(db: Session, data: ProductCreate) -> Product:
        product = Product(
            category_id=data.category_id,
            name=data.name,
            description=data.description,
            price=data.price,
            stock=data.stock,
            is_active=True,
        )
        db.add(product)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        return db.scalar(
            select(Product)
            .options(selectinload(Product.images))
            .where(Product.id == product_id)
        )

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
        stmt = (
            select(Product)
            .options(selectinload(Product.images))
            .where(Product.is_active == True)
        )

        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
        if search:
            stmt = stmt.where(Product.name.ilike(f"%{search}%"))
        if min_price is not None:
            stmt = stmt.where(Product.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.price <= max_price)

        stmt = stmt.order_by(Product.id.asc()).offset(skip).limit(limit)
        return db.scalars(stmt).all()

    @staticmethod
    def list_all_admin(
        db: Session,
        category_id: Optional[int] = None,
        search: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Product]:
        stmt = select(Product).options(selectinload(Product.images))

        if is_active is not None:
            stmt = stmt.where(Product.is_active == is_active)
        if category_id is not None:
            stmt = stmt.where(Product.category_id == category_id)
        if search:
            stmt = stmt.where(Product.name.ilike(f"%{search}%"))
        if min_price is not None:
            stmt = stmt.where(Product.price >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.price <= max_price)

        stmt = stmt.order_by(Product.id.asc()).offset(skip).limit(limit)
        return db.scalars(stmt).all()

    @staticmethod
    def update(db: Session, product: Product, data: ProductUpdate) -> Product:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)
        db.commit()
        db.refresh(product)
        return product

    @staticmethod
    def soft_delete(db: Session, product: Product) -> Product:
        product.is_active = False
        db.commit()
        db.refresh(product)
        return product

