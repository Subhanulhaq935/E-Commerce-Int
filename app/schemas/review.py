from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")
    comment: str = Field(..., min_length=1, max_length=1000, description="Review comment")
    guest_name: Optional[str] = Field(None, max_length=100, description="Guest reviewer name")

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Review comment cannot be empty")
        return v.strip()

    @field_validator("guest_name")
    @classmethod
    def validate_guest_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_stripped = v.strip()
            return v_stripped if v_stripped else None
        return None


class ReviewResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: str
    product_id: int
    rating: int
    comment: Optional[str] = None
    is_verified_purchase: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
