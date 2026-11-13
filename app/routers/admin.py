from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.product import ProductResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/products",
    response_model=List[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="List all products including inactive (Admin only)",
)
def admin_list_products(
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    min_price: Optional[Decimal] = Query(None, ge=0),
    max_price: Optional[Decimal] = Query(None, ge=0),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ProductService.list_admin(
        db,
        category_id=category_id,
        search=search,
        min_price=min_price,
        max_price=max_price,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )

