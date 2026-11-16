from typing import Sequence
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.address import Address
from app.repositories.address_repository import AddressRepository
from app.schemas.address import AddressCreate, AddressUpdate


class AddressService:
    @staticmethod
    def create(db: Session, user_id: int, data: AddressCreate) -> Address:
        count = AddressRepository.count_by_user(db, user_id=user_id)

        # Pehla address automatically default banega
        if count == 0:
            is_default = True
        elif data.is_default:
            AddressRepository.unset_all_default(db, user_id=user_id)
            is_default = True
        else:
            is_default = False

        return AddressRepository.create(
            db, user_id=user_id, data=data, is_default=is_default
        )

    @staticmethod
    def list_by_user(db: Session, user_id: int) -> Sequence[Address]:
        return AddressRepository.list_by_user(db, user_id=user_id)

    @staticmethod
    def update(
        db: Session, user_id: int, address_id: int, data: AddressUpdate
    ) -> Address:
        address = AddressRepository.get_by_id_and_user(
            db, address_id=address_id, user_id=user_id
        )
        if not address:
            # Check buyer isolation
            existing_other = AddressRepository.get_by_id(
                db, address_id=address_id
            )
            if existing_other:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this address",
                )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found",
            )

        if data.is_default:
            AddressRepository.unset_all_default(db, user_id=user_id)

        return AddressRepository.update(db, address=address, data=data)

    @staticmethod
    def delete(db: Session, user_id: int, address_id: int) -> dict[str, str]:
        address = AddressRepository.get_by_id_and_user(
            db, address_id=address_id, user_id=user_id
        )
        if not address:
            existing_other = AddressRepository.get_by_id(
                db, address_id=address_id
            )
            if existing_other:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this address",
                )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Address not found",
            )

        # Check agar address kisi order mein use ho chuka ho
        if address.orders:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete address used in existing orders",
            )

        was_default = address.is_default
        AddressRepository.delete(db, address=address)

        # Agar default address delete hua ho to bache huay agle address ko default banayein
        if was_default:
            remaining = AddressRepository.list_by_user(db, user_id=user_id)
            if remaining:
                remaining[0].is_default = True
                db.commit()

        return {"message": "Address deleted"}
