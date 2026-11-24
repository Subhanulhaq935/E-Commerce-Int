from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.address import AddressCreate, AddressResponse, AddressUpdate
from app.services.address_service import AddressService

router = APIRouter(prefix="/addresses", tags=["Addresses"])


@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    data: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Naya delivery address add karein (Authenticated user)"""
    return AddressService.create(db, user_id=current_user.id, data=data)


@router.get("/", response_model=List[AddressResponse])
def get_my_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apne tamam saved addresses dekhain (Authenticated user)"""
    return AddressService.list_by_user(db, user_id=current_user.id)


@router.put("/{id}", response_model=AddressResponse)
def update_address(
    id: int,
    data: AddressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apna address update karein (Authenticated user)"""
    return AddressService.update(db, user_id=current_user.id, address_id=id, data=data)


@router.delete("/{id}")
def delete_address(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apna address delete karein (Authenticated user)"""
    return AddressService.delete(db, user_id=current_user.id, address_id=id)
