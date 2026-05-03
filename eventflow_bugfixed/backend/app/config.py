from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "EventFlow"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    FRONTEND_URL: str = "http://localhost:5500"

    # Database
    DATABASE_URL: str = "sqlite:///./eventflow.db"

    # JWT
    SECRET_KEY: str = "eventflow-change-in-production-2025-xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440   # 24h
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@eventflow.in"
    EMAIL_ENABLED: bool = False

    # File Upload
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 10
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]

    # Razorpay (Payment)
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_KEY_SECRET: Optional[str] = None
    PAYMENT_ENABLED: bool = False

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60   # seconds

    # Pagination
    DEFAULT_PAGE_SIZE: int = 9
    MAX_PAGE_SIZE: int = 50

    class Config:
        env_file = ".env"

settings = Settings()
