from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post(
    "/",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new category (Admin only)",
)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return CategoryService.create(db, data)


@router.get(
    "/",
    response_model=List[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all categories (Public)",
)
def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return CategoryService.list_all(db, skip=skip, limit=limit)


@router.put(
    "/{id}",
    response_model=CategoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Update category (Admin only)",
)
def update_category(
    id: int,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return CategoryService.update(db, category_id=id, data=data)


@router.delete(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Delete category (Admin only)",
)
def delete_category(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return CategoryService.delete(db, category_id=id)

