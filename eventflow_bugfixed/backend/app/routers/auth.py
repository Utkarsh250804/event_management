from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app import models, schemas
from app.utils.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user
from app.utils.helpers import notify, log_activity
from app.services.email_service import send_welcome_email

router = APIRouter()

@router.post("/register", response_model=schemas.Token, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(400, "Email already registered")
    user = models.User(
        name=payload.name, email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role, phone=payload.phone,
    )
    db.add(user)
    db.commit(); db.refresh(user)
    notify(db, user.id, "Welcome to EventFlow! 🎉", f"Hi {user.name}! Start exploring amazing events.", "success", "/")
    if payload.role == models.UserRole.organizer:
        profile = models.OrganizerProfile(user_id=user.id)
        db.add(profile); db.commit()
    send_welcome_email(user.email, user.name)
    log_activity(db, user.id, "register")
    return _token_response(user)

@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "Account deactivated")
    user.last_login = datetime.now(timezone.utc)
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    log_activity(db, user.id, "login")
    return _token_response(user)

@router.post("/login/form", response_model=schemas.Token, include_in_schema=False)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return _token_response(user)

@router.post("/refresh", response_model=schemas.Token)
def refresh(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    td = decode_token(payload.refresh_token)
    user = db.query(models.User).filter(models.User.id == td.user_id).first()
    if not user:
        raise HTTPException(401, "User not found")
    return _token_response(user)

@router.get("/me", response_model=schemas.UserOut)
def me(u: models.User = Depends(get_current_user)):
    return u

@router.post("/logout")
def logout():
    return {"message": "Logged out"}

def _token_response(user: models.User) -> schemas.Token:
    return schemas.Token(
        access_token=create_access_token({"sub": str(user.id), "role": user.role}),
        refresh_token=create_refresh_token({"sub": str(user.id), "role": user.role}),
        user=schemas.UserOut.model_validate(user)
    )
