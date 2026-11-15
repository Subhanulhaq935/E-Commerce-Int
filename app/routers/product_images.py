from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.product_image import ProductImageResponse
from app.services.image_service import ImageService

router = APIRouter(tags=["Product Images"])


@router.post(
    "/products/{id}/images",
    response_model=List[ProductImageResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload multiple images for a product (Admin only)",
)
async def upload_product_images(
    id: int,
    files: List[UploadFile] = File(
        ...,
        description="Select 1 or more image files (jpg, png, webp, max 5MB)",
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return await ImageService.upload_images(db, product_id=id, files=files)


@router.delete(
    "/product-images/{id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a product image (Admin only)",
)
def delete_product_image(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return ImageService.delete_image(db, image_id=id)
