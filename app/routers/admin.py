from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.enums import OrderStatus, UserRole
from app.models.user import User
from app.schemas.order import OrderResponse, OrderStatusUpdate
from app.schemas.product import ProductResponse
from app.schemas.user import UserResponse, UserStatusUpdate
from app.services.admin_service import AdminService
from app.services.order_service import OrderService
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


@router.get(
    "/orders",
    response_model=List[OrderResponse],
    status_code=status.HTTP_200_OK,
    summary="List all orders with filters (Admin only)",
)
def admin_list_orders(
    status: Optional[OrderStatus] = Query(None),
    buyer_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return OrderService.list_admin_orders(
        db, status_filter=status, buyer_id=buyer_id, skip=skip, limit=limit
    )


@router.patch(
    "/orders/{id}/status",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Update order status and auto-complete payment on delivery (Admin only)",
)
def admin_update_order_status(
    id: int,
    data: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return OrderService.update_order_status(
        db, order_id=id, new_status=data.status, background_tasks=background_tasks
    )


@router.patch(
    "/orders/{id}/cancel",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel order and restore product stock (Admin only)",
)
def admin_cancel_order(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return AdminService.cancel_order(
        db, order_id=id, background_tasks=background_tasks
    )


@router.get(
    "/users",
    response_model=List[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List all users with filters (Admin only)",
)
def admin_list_users(
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return AdminService.list_users(
        db, role=role, is_active=is_active, skip=skip, limit=limit
    )


@router.patch(
    "/users/{id}/status",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Activate or deactivate a user (Admin only)",
)
def admin_update_user_status(
    id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return AdminService.update_user_status(
        db,
        current_admin=current_admin,
        target_user_id=id,
        is_active=data.is_active,
    )
