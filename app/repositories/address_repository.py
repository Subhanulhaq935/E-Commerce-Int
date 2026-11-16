from typing import Optional, Sequence
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate


class AddressRepository:
    @staticmethod
    def get_by_id_and_user(
        db: Session, address_id: int, user_id: int
    ) -> Optional[Address]:
        return db.scalar(
            select(Address).where(
                Address.id == address_id, Address.user_id == user_id
            )
        )

    @staticmethod
    def get_by_id(db: Session, address_id: int) -> Optional[Address]:
        return db.scalar(select(Address).where(Address.id == address_id))

    @staticmethod
    def list_by_user(db: Session, user_id: int) -> Sequence[Address]:
        return db.scalars(
            select(Address)
            .where(Address.user_id == user_id)
            .order_by(Address.is_default.desc(), Address.id.asc())
        ).all()

    @staticmethod
    def count_by_user(db: Session, user_id: int) -> int:
        return len(
            db.scalars(
                select(Address.id).where(Address.user_id == user_id)
            ).all()
        )

    @staticmethod
    def unset_all_default(db: Session, user_id: int) -> None:
        db.execute(
            update(Address)
            .where(Address.user_id == user_id)
            .values(is_default=False)
        )
        db.commit()

    @staticmethod
    def create(
        db: Session, user_id: int, data: AddressCreate, is_default: bool
    ) -> Address:
        address = Address(
            user_id=user_id,
            full_name=data.full_name,
            phone=data.phone,
            address_line=data.address_line,
            city=data.city,
            postal_code=data.postal_code,
            country=data.country,
            is_default=is_default,
        )
        db.add(address)
        db.commit()
        db.refresh(address)
        return address

    @staticmethod
    def update(
        db: Session, address: Address, data: AddressUpdate
    ) -> Address:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(address, key, value)
        db.commit()
        db.refresh(address)
        return address

    @staticmethod
    def delete(db: Session, address: Address) -> None:
        db.delete(address)
        db.commit()
