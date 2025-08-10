from pydantic_settings import BaseSettings
from pydantic import EmailStr


class Settings(BaseSettings):
    # Database
    database_url: str

    # Security
    secret_key: str
    algorithm: str = "HS256"  # Could also use RS256, ES256 for asymmetric
    access_token_expire_minutes: int

    # Email
    email_host: str
    email_port: int = 587
    email_username: EmailStr
    email_password: str
    email_from: EmailStr

    # App
    environment: str = "development"
    debug: bool = False

    # CORS
    backend_cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
