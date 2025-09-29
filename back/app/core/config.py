from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr, field_validator
import json

class Settings(BaseSettings):
    # Pydantic v2 settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,   # matches your old intent
        extra="ignore",         # or "forbid" if you add all fields explicitly
    )

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

    # CORS - can be a JSON string or list
    backend_cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    @field_validator('backend_cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                # Try to parse as JSON string first (for Docker env vars)
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                # If not JSON, split by comma
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

settings = Settings()
