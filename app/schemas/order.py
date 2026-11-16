from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus


class CheckoutRequest(BaseModel):
    shipping_address_id: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
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
    buyer_id: int
    shipping_address_id: int
    total_amount: Decimal
    status: OrderStatus
    created_at: datetime
    items: List[OrderItemResponse]
    payment: Optional[PaymentResponse] = None

    model_config = ConfigDict(from_attributes=True)
