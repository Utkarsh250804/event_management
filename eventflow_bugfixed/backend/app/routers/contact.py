from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.post("", response_model=schemas.ContactOut, status_code=201)
def contact(payload: schemas.ContactCreate, db: Session = Depends(get_db)):
    msg = models.ContactMessage(**payload.model_dump())
    db.add(msg); db.commit(); db.refresh(msg)
    return msg

@router.post("/newsletter", status_code=201)
def subscribe_newsletter(payload: schemas.NewsletterSubscribe, db: Session = Depends(get_db)):
    existing = db.query(models.NewsletterSubscriber).filter(models.NewsletterSubscriber.email == payload.email).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True; db.commit()
            return {"message": "Re-subscribed successfully"}
        raise HTTPException(400, "Already subscribed")
    sub = models.NewsletterSubscriber(email=payload.email, name=payload.name, categories=payload.categories)
    db.add(sub); db.commit()
    return {"message": "Subscribed successfully"}

@router.delete("/newsletter/{email}", status_code=200)
def unsubscribe(email: str, db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    sub = db.query(models.NewsletterSubscriber).filter(models.NewsletterSubscriber.email == email).first()
    if not sub: raise HTTPException(404, "Not found")
    sub.is_active = False
    sub.unsubscribed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Unsubscribed"}
