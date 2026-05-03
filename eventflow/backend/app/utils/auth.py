from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app import models, schemas


# ✅ FIX 1: bcrypt config (important)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__truncate_error=False   # 🔥 crash fix
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
oauth2_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# ✅ FIX 2: safe password hashing
def hash_password(p: str) -> str:
    return pwd_context.hash(p[:72])   # 🔥 main fix


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain[:72], hashed)


# ✅ TOKEN FUNCTIONS
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ✅ DECODE TOKEN
def decode_token(token: str) -> schemas.TokenData:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        return schemas.TokenData(
            user_id=int(user_id),
            role=payload.get("role")
        )

    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# ✅ GET CURRENT USER
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:

    td = decode_token(token)

    user = db.query(models.User).filter(models.User.id == td.user_id).first()

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    return user


# ✅ OPTIONAL USER
def get_optional_user(
    token: Optional[str] = Depends(oauth2_optional),
    db: Session = Depends(get_db)
) -> Optional[models.User]:

    if not token:
        return None

    try:
        td = decode_token(token)
        return db.query(models.User).filter(models.User.id == td.user_id).first()
    except:
        return None


# ✅ ROLE CHECKS
def require_organizer(u: models.User = Depends(get_current_user)) -> models.User:
    if u.role not in [models.UserRole.organizer, models.UserRole.admin]:
        raise HTTPException(status_code=403, detail="Organizer access required")
    return u


def require_admin(u: models.User = Depends(get_current_user)) -> models.User:
    if u.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return u