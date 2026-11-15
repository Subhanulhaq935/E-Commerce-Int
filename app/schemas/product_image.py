from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ProductImageResponse(BaseModel):
    id: int
    product_id: int
    image_url: str
    is_primary: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
