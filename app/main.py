from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.routers.auth import router as auth_router
from app.routers.categories import router as categories_router

app = FastAPI(title="Single-Vendor E-Commerce API", version="1.0.0")

app.include_router(auth_router)
app.include_router(categories_router)


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
