from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str) -> str:
        clean = value.strip()
        if not clean:
            raise ValueError("Category name cannot be empty")
        return clean


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            clean = value.strip()
            if not clean:
                raise ValueError("Category name cannot be empty")
            return clean
        return value


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

