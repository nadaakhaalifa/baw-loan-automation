from pydantic_settings import BaseSettings


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

    class Config:
        env_file = ".env"


settings = Settings()