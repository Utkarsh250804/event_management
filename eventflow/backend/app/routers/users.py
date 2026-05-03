from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import os, uuid

from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user, hash_password, verify_password

router = APIRouter()

@router.get("/profile", response_model=schemas.UserOut)
def profile(u: models.User = Depends(get_current_user)):
    return u

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(payload: schemas.UserUpdate, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(u, k, v)
    db.commit(); db.refresh(u)
    return u

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]: raise HTTPException(400, "Invalid image type")
    name = f"avatar_{u.id}_{uuid.uuid4().hex[:6]}.{ext}"
    with open(os.path.join("uploads", name), "wb") as f:
        f.write(await file.read())
    u.avatar_url = f"/uploads/{name}"
    db.commit()
    return {"avatar_url": u.avatar_url}

@router.post("/change-password")
def change_password(payload: schemas.ChangePassword, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, u.hashed_password):
        raise HTTPException(400, "Current password incorrect")
    u.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated"}

@router.get("/wishlist", response_model=List[schemas.EventOut])
def wishlist(u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.routers.events import _enrich
    items = db.query(models.Wishlist).filter(models.Wishlist.user_id == u.id).all()
    return [_enrich(i.event, db) for i in items if i.event]

@router.get("/notifications", response_model=List[schemas.NotificationOut])
def notifications(u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Notification).filter(models.Notification.user_id == u.id).order_by(models.Notification.created_at.desc()).limit(50).all()

@router.get("/notifications/unread-count")
def unread_count(u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(models.Notification).filter(models.Notification.user_id == u.id, models.Notification.is_read == False).count()
    return {"count": count}

@router.post("/notifications/read-all")
def read_all(u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Notification).filter(models.Notification.user_id == u.id, models.Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All read"}

@router.delete("/notifications/{nid}", status_code=204)
def delete_notif(nid: int, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    n = db.query(models.Notification).filter(models.Notification.id == nid, models.Notification.user_id == u.id).first()
    if not n: raise HTTPException(404, "Not found")
    db.delete(n); db.commit()

@router.get("/activity")
def activity(u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    acts = db.query(models.UserActivity).filter(models.UserActivity.user_id == u.id).order_by(models.UserActivity.created_at.desc()).limit(20).all()
    return [{"action": a.action, "entity_type": a.entity_type, "entity_id": a.entity_id, "meta": a.meta, "created_at": str(a.created_at)} for a in acts]
