from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.models.enums import PaymentMethod, PaymentStatus


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    paid_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
