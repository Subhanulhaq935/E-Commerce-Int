import os
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.routers.addresses import router as addresses_router
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.categories import router as categories_router
from app.routers.product_images import router as product_images_router
from app.routers.products import router as products_router

app = FastAPI(title="Single-Vendor E-Commerce API", version="1.0.0")

# Static files mount for uploaded images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(products_router)
app.include_router(product_images_router)
app.include_router(admin_router)
app.include_router(addresses_router)
app.include_router(cart_router)


# Swagger UI mein file upload button show karne ke liye
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
    for s in schema.get("components", {}).get("schemas", {}).values():
        for prop in s.get("properties", {}).values():
            if prop.get("type") == "array" and "items" in prop:
                if "contentMediaType" in prop["items"]:
                    prop["items"]["format"] = "binary"
            elif "contentMediaType" in prop:
                prop["format"] = "binary"
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.get("/health/db", tags=["Health"])
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"database": "connected"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}",
        )
