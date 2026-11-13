from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import LoginRequest, TokenResponse, UserCreate


class AuthService:
    @staticmethod
    def register(db: Session, user_data: UserCreate) -> User:
        existing = UserRepository.get_by_email(db, user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        hashed = hash_password(user_data.password)
        # Single vendor: Public signup is strictly for buyers
        user = UserRepository.create(
            db=db,
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed,
            role=UserRole.buyer,
        )
        return user

    @staticmethod
    def login(db: Session, login_data: LoginRequest) -> TokenResponse:
        user = UserRepository.get_by_email(db, login_data.email)
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )
        return TokenResponse(access_token=token, token_type="bearer")

