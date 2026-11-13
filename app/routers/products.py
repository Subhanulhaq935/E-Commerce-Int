from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product (Admin only)",
)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ProductService.create(db, data)


@router.get(
    "/",
    response_model=List[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="Get active products with filters (Public)",
)
def list_products(
    category_id: Optional[int] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search product by name"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return ProductService.list_active(
        db,
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product details (Public)",
)
def get_product(
    id: int,
    db: Session = Depends(get_db),
):
    return ProductService.get_active(db, product_id=id)


@router.put(
    "/{id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product details or stock (Admin only)",
)
def update_product(
    id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ProductService.update(db, product_id=id, data=data)


@router.delete(
    "/{id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Soft delete product (Admin only)",
)
def delete_product(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ProductService.delete(db, product_id=id)

