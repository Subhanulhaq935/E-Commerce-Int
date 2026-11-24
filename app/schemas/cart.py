from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, description="Quantity must be at least 1")
    size: Optional[str] = None


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1, description="Quantity must be at least 1")


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    unit_price: Decimal
    original_price: Optional[Decimal] = None
    size: Optional[str] = None
    quantity: int
    subtotal: Decimal
    image_url: Optional[str] = None
    available_stock: int = Field(default=0, description="Available stock for this item/size")

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: int
    items: List[CartItemResponse]
    total: Decimal

    model_config = ConfigDict(from_attributes=True)
