import os
import sys
from dotenv import load_dotenv

# Ensure root path is accessible
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.user_repository import UserRepository


def create_admin():
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")
    name = os.getenv("ADMIN_NAME", "Admin (Store Owner)")

    if not email or not password:
        raise ValueError(
            "Security Error: ADMIN_EMAIL aur ADMIN_PASSWORD .env file mein set hona zaroori hain!"
        )

    db = SessionLocal()
    try:
        existing_user = UserRepository.get_by_email(db, email=email)
        if existing_user:
            if existing_user.role != UserRole.admin:
                existing_user.role = UserRole.admin
                db.commit()
                print(f"User {email} updated to Admin role successfully!")
            else:
                print(f"Admin already exists with email: {email}")
            return

        admin_user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        print(f"Admin created successfully! Email: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
