from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator


class AddressCreate(BaseModel):
    full_name: str
    phone: str
    address_line: str
    city: str
    postal_code: str
    country: str = "Pakistan"
    is_default: bool = False

    @field_validator("full_name", "phone", "address_line", "city", "postal_code")
    @classmethod
    def check_non_empty(cls, value: str) -> str:
        clean = value.strip()
        if not clean:
            raise ValueError("Field cannot be empty")
        return clean


class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None

    @field_validator("full_name", "phone", "address_line", "city", "postal_code")
    @classmethod
    def check_non_empty_optional(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            clean = value.strip()
            if not clean:
                raise ValueError("Field cannot be empty")
            return clean
        return value


class AddressResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str
    address_line: str
    city: str
    postal_code: str
    country: str
    is_default: bool

    model_config = ConfigDict(from_attributes=True)
