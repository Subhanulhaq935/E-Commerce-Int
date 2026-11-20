from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    UPLOAD_DIR: str = "uploads"
    MAX_IMAGE_SIZE_MB: int = 5
    MAX_IMAGES_PER_PRODUCT: int = 5
    DELIVERY_CHARGE: float = 0.0
    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_EMAIL: str | None = None
    SMTP_PASSWORD: str | None = None
    FRONTEND_URL: str = "https://e-commerce-int.vercel.app"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

