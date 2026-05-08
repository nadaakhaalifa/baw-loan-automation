"""
Authentication API

Handles:
- User registration
- User login
- JWT token generation
- Forgot password SMS verification
- Welcome email sending
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    TokenResponse,
    ForgotPasswordSendCodeRequest,
    ResetPasswordRequest,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from app.services.sms_service import (
    send_verification_code,
    verify_code,
)
from app.services.email_service import send_real_email


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    phone_number = payload.phone_number.replace(" ", "").strip()

    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    existing_phone = db.query(User).filter(
        User.phone_number == phone_number
    ).first()

    if existing_phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number already registered",
        )

    user = User(
        full_name=payload.full_name,
        email=email,
        phone_number=phone_number,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    send_real_email(
        to_email=user.email,
        subject="Welcome to BAW Loan Automation",
        body=f"""
Hello {user.full_name},

Your account has been created successfully.

You can now log in to the BAW Loan Automation portal.

Role: {user.role}

Best regards,
BAW Loan Automation Team
""",
    )

    return {
        "message": "User registered successfully",
        "user_id": user.id,
    }


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username.lower().strip()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(
        {
            "sub": user.email,
            "role": user.role,
        }
    )

    return TokenResponse(access_token=token)


@router.post("/forgot-password/send-code")
def forgot_password_send_code(
    payload: ForgotPasswordSendCodeRequest,
    db: Session = Depends(get_db),
):
    phone_number = payload.phone_number.replace(" ", "").strip()

    user = db.query(User).filter(
        User.phone_number == phone_number,
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this phone number.",
        )

    send_verification_code(phone_number)

    return {
        "message": "Verification code sent successfully",
    }


@router.post("/forgot-password/reset")
def forgot_password_reset(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    phone_number = payload.phone_number.replace(" ", "").strip()

    user = db.query(User).filter(
        User.phone_number == phone_number,
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this phone number.",
        )

    is_valid = verify_code(
        phone_number,
        payload.code,
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Invalid verification code.",
        )

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    send_real_email(
        to_email=user.email,
        subject="Your BAW Loan Automation Password Was Reset",
        body=f"""
Hello {user.full_name},

Your password was reset successfully.

If you did not request this change, please contact your system administrator immediately.

Best regards,
BAW Loan Automation Team
""",
    )

    return {
        "message": "Password reset successfully",
    }