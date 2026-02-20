"""
RSA MVP Enhanced — Application Configuration
=============================================
Centralized configuration using Pydantic Settings.
Reads from environment variables / .env file.
Defaults to SQLite for local development (no PostgreSQL needed).
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # --- Application ---
    APP_NAME: str = "RSA MVP Enhanced"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False  # Set to True in .env for local development
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    
    # --- Database (SQLite default for dev, PostgreSQL for production) ---
    DATABASE_URL: str = "sqlite:///./rsa_dev.db"
    
    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # --- CORS ---
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # --- AI / NLP ---
    HUGGINGFACE_API_TOKEN: str = ""
    OPENAI_API_KEY: str = ""
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # --- File Upload ---
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: str = "pdf,docx,txt,doc"
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",")]
    
    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    
    # --- Data Retention ---
    DATA_RETENTION_DAYS: int = 90
    
    # --- ATS Webhook ---
    ATS_WEBHOOK_URL: str = ""
    ATS_WEBHOOK_SECRET: str = ""
    
    # --- Matching Defaults ---
    DEFAULT_SKILL_WEIGHT: float = 0.4
    DEFAULT_EXPERIENCE_WEIGHT: float = 0.3
    DEFAULT_EDUCATION_WEIGHT: float = 0.2
    DEFAULT_SEMANTIC_WEIGHT: float = 0.1
    
    # --- Auth ---
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Singleton settings instance
settings = Settings()
