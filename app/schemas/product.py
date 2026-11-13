from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProductImageResponse(BaseModel):
    id: int
    image_url: str
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


class ProductCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0, description="Price must be greater than 0")
    stock: int = Field(default=0, ge=0, description="Stock must be greater than or equal to 0")

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        clean = value.strip()
        if not clean:
            raise ValueError("Product name cannot be empty")
        return clean


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            clean = value.strip()
            if not clean:
                raise ValueError("Product name cannot be empty")
            return clean
        return value


class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageResponse] = []

    model_config = ConfigDict(from_attributes=True)

