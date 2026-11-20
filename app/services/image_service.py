import os
import uuid
from typing import List
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.product import Product
from app.models.product_image import ProductImage
from app.repositories.product_repository import ProductRepository

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def validate_image_bytes(filename: str, content: bytes) -> str:
    # 1. Extension check
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # 2. Size check (Max 5MB)
    max_size_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image size exceeds the maximum limit of {settings.MAX_IMAGE_SIZE_MB}MB",
        )

    # 3. Magic Bytes check (Content spoofing protection)
    is_valid = False
    if ext in {"jpg", "jpeg"} and content.startswith(b"\xff\xd8\xff"):
        is_valid = True
    elif ext == "png" and content.startswith(b"\x89PNG\r\n\x1a\n"):
        is_valid = True
    elif ext == "webp" and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted file or content does not match the image extension",
        )

    return ext


class ImageService:
    @staticmethod
    async def upload_images(
        db: Session, product_id: int, files: List[UploadFile]
    ) -> List[ProductImage]:
        product = ProductRepository.get_by_id(db, product_id=product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        current_images_count = len(product.images)
        if current_images_count + len(files) > settings.MAX_IMAGES_PER_PRODUCT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot upload more than {settings.MAX_IMAGES_PER_PRODUCT} images for a product. Currently has {current_images_count}.",
            )

        has_primary = any(img.is_primary for img in product.images)
        saved_images: List[ProductImage] = []

        # Check if Cloudinary is configured
        use_cloudinary = bool(
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
        )
        if use_cloudinary:
            import cloudinary
            import cloudinary.uploader

            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True,
            )
        else:
            target_dir = os.path.join(settings.UPLOAD_DIR, "products", str(product_id))
            os.makedirs(target_dir, exist_ok=True)

        for file in files:
            content = await file.read()
            ext = validate_image_bytes(file.filename or "", content)

            if use_cloudinary:
                upload_res = cloudinary.uploader.upload(
                    content,
                    folder=f"ecommerce/products/{product_id}",
                    resource_type="image",
                )
                image_url = upload_res.get("secure_url")
            else:
                unique_filename = f"{uuid.uuid4().hex}.{ext}"
                file_disk_path = os.path.join(target_dir, unique_filename)

                with open(file_disk_path, "wb") as f:
                    f.write(content)

                image_url = f"/uploads/products/{product_id}/{unique_filename}"

            is_primary = False
            if not has_primary:
                is_primary = True
                has_primary = True

            product_image = ProductImage(
                product_id=product_id,
                image_url=image_url,
                is_primary=is_primary,
            )
            db.add(product_image)
            saved_images.append(product_image)

        db.commit()
        for img in saved_images:
            db.refresh(img)

        return saved_images

    @staticmethod
    def delete_image(db: Session, image_id: int) -> dict[str, str]:
        image = db.scalar(
            select(ProductImage).where(ProductImage.id == image_id)
        )
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        product_id = image.product_id
        was_primary = image.is_primary

        # Disk se file delete karein (agar local relative path ho)
        if not image.image_url.startswith("http"):
            relative_path = image.image_url.lstrip("/")
            if os.path.exists(relative_path):
                try:
                    os.remove(relative_path)
                except OSError:
                    pass
        elif (
            settings.CLOUDINARY_CLOUD_NAME
            and settings.CLOUDINARY_API_KEY
            and settings.CLOUDINARY_API_SECRET
            and "cloudinary.com" in image.image_url
        ):
            try:
                import re
                import cloudinary
                import cloudinary.uploader

                cloudinary.config(
                    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                    api_key=settings.CLOUDINARY_API_KEY,
                    api_secret=settings.CLOUDINARY_API_SECRET,
                    secure=True,
                )
                match = re.search(r"/upload/(?:v\d+/)?([^\.]+)", image.image_url)
                if match:
                    public_id = match.group(1)
                    cloudinary.uploader.destroy(public_id)
            except Exception:
                pass

        db.delete(image)
        db.flush()

        # Agar primary delete hui ho to agli image ko primary banayein
        if was_primary:
            next_image = db.scalar(
                select(ProductImage)
                .where(ProductImage.product_id == product_id)
                .order_by(ProductImage.id.asc())
            )
            if next_image:
                next_image.is_primary = True

        db.commit()
        return {"message": "Image deleted"}
