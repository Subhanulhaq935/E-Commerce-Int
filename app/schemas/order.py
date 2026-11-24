from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.address import AddressResponse
from app.schemas.user import UserResponse


class CheckoutRequest(BaseModel):
    shipping_address_id: Optional[int] = None
    guest_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    guest_email: Optional[EmailStr] = None
    guest_phone: Optional[str] = Field(default=None, min_length=7, max_length=50)
    guest_address: Optional[str] = Field(default=None, min_length=5, max_length=500)
    guest_city: Optional[str] = Field(default=None, min_length=2, max_length=100)
    guest_postal_code: Optional[str] = Field(default=None, max_length=20)


class GuestCheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")
    size: Optional[str] = None


class GuestCheckoutRequest(BaseModel):
    guest_name: str = Field(..., min_length=2, max_length=255)
    guest_email: EmailStr
    guest_phone: str = Field(..., min_length=7, max_length=50)
    guest_address: str = Field(..., min_length=5, max_length=500)
    guest_city: str = Field(..., min_length=2, max_length=100)
    guest_postal_code: Optional[str] = Field(default=None, max_length=20)
    items: List[GuestCheckoutItem] = Field(..., min_length=1, description="At least one item is required")

    @field_validator("guest_name", "guest_phone", "guest_address", "guest_city")
    @classmethod
    def check_non_empty(cls, value: str) -> str:
        clean = value.strip()
        if not clean:
            raise ValueError("Field cannot be empty or whitespace only")
        return clean


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    size: Optional[str] = None
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    paid_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    buyer_id: Optional[int] = None
    shipping_address_id: Optional[int] = None
    total_amount: Decimal
    status: OrderStatus
    created_at: datetime
    guest_name: Optional[str] = None
    guest_email: Optional[str] = None
    guest_phone: Optional[str] = None
    guest_address: Optional[str] = None
    guest_city: Optional[str] = None
    guest_postal_code: Optional[str] = None
    tracking_token: Optional[str] = None
    items: List[OrderItemResponse]
    payment: Optional[PaymentResponse] = None
    shipping_address: Optional[AddressResponse] = None
    buyer: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
