import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.core.database import get_session
from app.auth.jwt import create_access_token
from app.auth.email import send_verification_email
from app.auth.dependencies import get_current_user
from app.auth.models import User, UserRole, VerificationCode

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# --- Request/Response schemas ---
class RegisterRequest(BaseModel):
    email: str
    password: str


class VerifyCodeRequest(BaseModel):
    email: str
    code: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TelegramInitData(BaseModel):
    init_data: str  # Telegram WebApp initData


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    is_verified: bool


class TelegramUserPayload(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None


# --- Helpers ---
def _generate_code() -> str:
    return str(random.randint(100000, 999999))


async def _create_or_update_user(session, email: str, password_hash: str | None = None) -> User:
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=str(random.getrandbits(128)), email=email, password_hash=password_hash)
        session.add(user)
    elif password_hash and not user.password_hash:
        user.password_hash = password_hash
    return user


# --- Endpoints ---
@router.post("/register", response_model=TokenResponse)
async def register(
    req: RegisterRequest,
    session=Depends(get_session),
):
    """Register via email + password. Sends verification code."""
    result = await session.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    password_hash = pwd_context.hash(req.password)
    user = User(
        email=req.email,
        password_hash=password_hash,
        role=UserRole.user,
    )
    session.add(user)
    await session.flush()

    # Generate and send verification code
    code = _generate_code()
    vc = VerificationCode(
        user_id=user.id,
        code=code,
        purpose="registration",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    session.add(vc)
    await session.commit()

    await send_verification_email(req.email, code)

    token = create_access_token({"user_id": user.id, "role": user.role.value, "email": user.email})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        is_verified=user.is_verified,
    )


@router.post("/verify", response_model=TokenResponse)
async def verify_email(
    req: VerifyCodeRequest,
    session=Depends(get_session),
):
    """Verify email with code."""
    result = await session.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_verified:
        raise HTTPException(400, "Already verified")

    result = await session.execute(
        select(VerificationCode).where(
            VerificationCode.user_id == user.id,
            VerificationCode.code == req.code,
            VerificationCode.purpose == "registration",
            VerificationCode.used == False,
            VerificationCode.expires_at > datetime.now(timezone.utc),
        )
    )
    vc = result.scalar_one_or_none()
    if not vc:
        raise HTTPException(400, "Invalid or expired code")

    vc.used = True
    user.is_verified = True
    await session.commit()

    token = create_access_token({"user_id": user.id, "role": user.role.value, "email": user.email})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        is_verified=True,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    session=Depends(get_session),
):
    """Login via email + password."""
    result = await session.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not pwd_context.verify(req.password, user.password_hash or ""):
        raise HTTPException(401, "Invalid credentials")

    from datetime import datetime as dt
    user.last_login = dt.now(timezone.utc)
    await session.commit()

    token = create_access_token({"user_id": user.id, "role": user.role.value, "email": user.email})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        is_verified=user.is_verified,
    )


@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(
    req: TelegramInitData,
    session=Depends(get_session),
):
    """
    Authenticate via Telegram WebApp init data.
    Validates Telegram signature and creates/returns user.
    """
    import hashlib
    import hmac
    import urllib.parse

    # Parse init data
    parsed = urllib.parse.parse_qs(req.init_data)
    hash_str = parsed.pop("hash", [None])[0]
    if not hash_str:
        raise HTTPException(400, "Invalid init data")

    # Build data check string
    data_check_lines = sorted([f"{k}={v[0]}" for k, v in parsed.items()])
    data_check_string = "\n".join(data_check_lines)

    # Verify signature using bot token
    from app.core.config import settings
    bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    if not bot_token:
        raise HTTPException(500, "TELEGRAM_BOT_TOKEN not configured")

    secret_key = hashlib.sha256(bot_token.encode()).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if computed_hash != hash_str:
        raise HTTPException(401, "Invalid Telegram signature")

    # Extract user info
    import json
    user_data = json.loads(parsed.get("user", ["{}"])[0])
    telegram_id = str(user_data.get("id"))
    username = user_data.get("username", "")

    # Find or create user
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            telegram_id=telegram_id,
            telegram_username=username,
            role=UserRole.user,
            is_verified=True,  # Telegram users are auto-verified
        )
        session.add(user)
        await session.flush()

    token = create_access_token({"user_id": user.id, "role": user.role.value, "telegram_id": user.telegram_id})

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        role=user.role.value,
        is_verified=user.is_verified,
    )


@router.post("/resend-code")
async def resend_code(
    email: str,
    session=Depends(get_session),
):
    """Resend verification code."""
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_verified:
        raise HTTPException(400, "Already verified")

    code = _generate_code()
    vc = VerificationCode(
        user_id=user.id,
        code=code,
        purpose="registration",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    session.add(vc)
    await session.commit()

    await send_verification_email(email, code)
    return {"status": "code_sent"}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info."""
    return user
