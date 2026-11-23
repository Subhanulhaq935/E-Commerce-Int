from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    String,
    Numeric,
    Integer,
    Boolean,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.product import Product


class ProductSize(Base):
    __tablename__ = "product_sizes"
    __table_args__ = (
        UniqueConstraint("product_id", "size", name="uq_product_size"),
        CheckConstraint("stock >= 0", name="check_product_size_stock_non_negative"),
        CheckConstraint("price IS NULL OR price > 0", name="check_product_size_price_positive"),
        CheckConstraint(
            "sale_price IS NULL OR (price IS NOT NULL AND sale_price > 0 AND sale_price < price)",
            name="check_product_size_sale_price_valid",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    size: Mapped[str] = mapped_column(String(20), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    sale_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="sizes")
