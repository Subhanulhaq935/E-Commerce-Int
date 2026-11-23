from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ProductSizeCreate(BaseModel):
    size: str = Field(..., min_length=1, max_length=20)
    stock: int = Field(default=0, ge=0)
    price: Optional[Decimal] = Field(default=None, gt=0, description="Size-specific normal price")
    sale_price: Optional[Decimal] = Field(default=None, gt=0, description="Size-specific sale price")
    is_available: bool = True

    @field_validator("size")
    @classmethod
    def check_size(cls, value: str) -> str:
        clean = value.strip()
        if not clean:
            raise ValueError("Size cannot be empty")
        return clean

    @model_validator(mode="after")
    def validate_size_pricing(self):
        if self.price is not None and self.sale_price is not None:
            if self.sale_price >= self.price:
                raise ValueError(f"Size '{self.size}' sale price must be less than its normal price")
        return self


class ProductSizeResponse(BaseModel):
    id: int
    product_id: int
    size: str
    stock: int
    price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    is_available: bool

    model_config = ConfigDict(from_attributes=True)


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
    sale_price: Optional[Decimal] = Field(default=None, gt=0, description="Sale price must be greater than 0")
    has_sizes: bool = False
    stock: int = Field(default=0, ge=0, description="Stock must be greater than or equal to 0")
    sizes: Optional[List[ProductSizeCreate]] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        clean = value.strip()
        if not clean:
            raise ValueError("Product name cannot be empty")
        return clean

    @model_validator(mode="after")
    def validate_pricing_and_sizes(self):
        if self.sale_price is not None and self.sale_price >= self.price:
            raise ValueError("Sale price must be less than normal price")
        if self.has_sizes:
            if not self.sizes or len(self.sizes) == 0:
                raise ValueError("Sizes must be provided when has_sizes is enabled")
        return self


class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    sale_price: Optional[Decimal] = Field(default=None, gt=0)
    has_sizes: Optional[bool] = None
    stock: Optional[int] = Field(default=None, ge=0)
    sizes: Optional[List[ProductSizeCreate]] = None
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

    @model_validator(mode="after")
    def validate_pricing_and_sizes(self):
        if self.price is not None and self.sale_price is not None:
            if self.sale_price >= self.price:
                raise ValueError("Sale price must be less than normal price")
        return self


class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    sale_price: Optional[Decimal] = None
    has_sizes: bool = False
    stock: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageResponse] = []
    sizes: List[ProductSizeResponse] = []
    average_rating: Optional[float] = None
    review_count: int = 0

    model_config = ConfigDict(from_attributes=True)
