"""
Authentication Schemas

Defines request and response models
for authentication operations.

Responsibilities:
- User registration validation
- Login validation
- Token response formatting
"""

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordSendCodeRequest(BaseModel):
    email: EmailStr
    phone_number: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    phone_number: str
    code: str
    new_password: str