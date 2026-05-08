from pydantic_settings import BaseSettings

"""
Application Configuration

Loads environment variables and application settings.

Responsibilities:
- Database configuration
- Redis configuration
- SMTP configuration
- Workflow limits and timeouts
- JWT authentication
- Twilio SMS verification

Environment variables are loaded from .env file.
"""


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str

    AUTO_APPROVAL_LIMIT: int = 50000
    MANAGER_ESCALATION_SECONDS: int = 120

    SMTP_ENABLED: bool = False
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "no-reply@loanworkflow.com"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_VERIFY_SERVICE_SID: str

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()