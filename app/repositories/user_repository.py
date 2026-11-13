from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.enums import UserRole


class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.scalar(select(User).where(User.email == email))

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.scalar(select(User).where(User.id == user_id))

    @staticmethod
    def create(
        db: Session,
        name: str,
        email: str,
        password_hash: str,
        role: UserRole = UserRole.buyer,
    ) -> User:
        user = User(
            name=name,
            email=email,
            password_hash=password_hash,
            role=role,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

