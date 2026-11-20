from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Numeric, DateTime, ForeignKey, String, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import OrderStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.address import Address
    from app.models.order_item import OrderItem
    from app.models.payment import Payment


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    buyer_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=True, index=True
    )
    shipping_address_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("addresses.id", ondelete="RESTRICT"), nullable=True
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name="order_status"),
        default=OrderStatus.pending,
        nullable=False,
    )

    # Guest Customer Details
    guest_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    guest_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    guest_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    guest_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    guest_city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    guest_postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tracking_token: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True, unique=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    buyer: Mapped[Optional["User"]] = relationship("User", back_populates="orders")
    shipping_address: Mapped[Optional["Address"]] = relationship("Address", back_populates="orders")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment", back_populates="order", uselist=False, cascade="all, delete-orphan"
    )

