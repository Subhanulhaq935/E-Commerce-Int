from unittest.mock import patch
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.main import app
from app.models.enums import UserRole
from app.models.user import User
from app.models.category import Category
from app.models.product import Product

# In-memory SQLite for fast, isolated automated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Har test ke liye fresh clean database tables banata hai"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient jo test db use karta hai"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    admin = User(
        name="Admin Test",
        email="admintest@example.com",
        password_hash=hash_password("Admin@12345"),
        role=UserRole.admin,
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def admin_token(admin_user):
    return create_access_token({"sub": str(admin_user.id), "role": admin_user.role.value})


@pytest.fixture
def buyer_user(db_session):
    buyer = User(
        name="Ali Khan",
        email="alitest@example.com",
        password_hash=hash_password("Ali@12345"),
        role=UserRole.buyer,
        is_active=True,
    )
    db_session.add(buyer)
    db_session.commit()
    db_session.refresh(buyer)
    return buyer


@pytest.fixture
def buyer_token(buyer_user):
    return create_access_token({"sub": str(buyer_user.id), "role": buyer_user.role.value})


@pytest.fixture
def buyer2_user(db_session):
    buyer2 = User(
        name="Sara Noor",
        email="saratest@example.com",
        password_hash=hash_password("Sara@12345"),
        role=UserRole.buyer,
        is_active=True,
    )
    db_session.add(buyer2)
    db_session.commit()
    db_session.refresh(buyer2)
    return buyer2


@pytest.fixture
def buyer2_token(buyer2_user):
    return create_access_token({"sub": str(buyer2_user.id), "role": buyer2_user.role.value})


@pytest.fixture
def sample_category(db_session):
    category = Category(name="Mobiles", description="Smartphones category")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


@pytest.fixture
def sample_product(db_session, sample_category):
    product = Product(
        category_id=sample_category.id,
        name="Samsung Mobile",
        description="Flagship smartphone",
        price=Decimal("50000.00"),
        stock=10,
        is_active=True,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


@pytest.fixture(autouse=True)
def mock_email_dispatch():
    """Mock external SMTP and Brevo network calls during automated test suites"""
    with patch("app.services.email_service.EmailService._dispatch_email", return_value=True) as mock_dispatch:
        yield mock_dispatch
