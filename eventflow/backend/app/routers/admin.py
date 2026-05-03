from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app import models, schemas
from app.utils.auth import require_admin
from app.utils.helpers import notify

router = APIRouter()

# ── /dashboard alias (frontend expects this) ─────────────────
@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = datetime.now(timezone.utc).date()
    stats = {
        "total_users":        db.query(func.count(models.User.id)).scalar() or 0,
        "total_organizers":   db.query(func.count(models.User.id)).filter(models.User.role == "organizer").scalar() or 0,
        "total_events":       db.query(func.count(models.Event.id)).scalar() or 0,
        "published_events":   db.query(func.count(models.Event.id)).filter(models.Event.status == "published").scalar() or 0,
        "total_bookings":     db.query(func.count(models.Booking.id)).scalar() or 0,
        "confirmed_bookings": db.query(func.count(models.Booking.id)).filter(models.Booking.status == "confirmed").scalar() or 0,
        "total_revenue":      float(db.query(func.sum(models.Booking.total_amount)).filter(models.Booking.status != "cancelled").scalar() or 0),
        "total_views":        db.query(func.count(models.EventView.id)).scalar() or 0,
        "new_users_today":    db.query(func.count(models.User.id)).filter(func.date(models.User.created_at) == today).scalar() or 0,
        "new_bookings_today": db.query(func.count(models.Booking.id)).filter(func.date(models.Booking.booked_at) == today).scalar() or 0,
    }
    from app.routers.bookings import _out
    from app.schemas import UserOut
    recent_b = db.query(models.Booking).order_by(models.Booking.booked_at.desc()).limit(5).all()
    recent_u = db.query(models.User).order_by(models.User.created_at.desc()).limit(5).all()
    return {
        "stats": stats,
        "recent_bookings": [_out(b) for b in recent_b],
        "recent_users":    [UserOut.model_validate(u) for u in recent_u],
    }

@router.get("/stats", response_model=schemas.AdminStats)
def stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = datetime.now(timezone.utc).date()
    return schemas.AdminStats(
        total_users=db.query(func.count(models.User.id)).scalar() or 0,
        total_organizers=db.query(func.count(models.User.id)).filter(models.User.role == "organizer").scalar() or 0,
        total_events=db.query(func.count(models.Event.id)).scalar() or 0,
        published_events=db.query(func.count(models.Event.id)).filter(models.Event.status == "published").scalar() or 0,
        total_bookings=db.query(func.count(models.Booking.id)).scalar() or 0,
        confirmed_bookings=db.query(func.count(models.Booking.id)).filter(models.Booking.status == "confirmed").scalar() or 0,
        total_revenue=float(db.query(func.sum(models.Booking.total_amount)).filter(models.Booking.status != "cancelled").scalar() or 0),
        total_views=db.query(func.count(models.EventView.id)).scalar() or 0,
        new_users_today=db.query(func.count(models.User.id)).filter(func.date(models.User.created_at) == today).scalar() or 0,
        new_bookings_today=db.query(func.count(models.Booking.id)).filter(func.date(models.Booking.booked_at) == today).scalar() or 0,
    )

# ── Users ─────────────────────────────────────────────────────
@router.get("/users", response_model=schemas.UserListOut)
def list_users(q: Optional[str] = None, role: Optional[str] = None, page: int = 1, limit: int = 20, db: Session = Depends(get_db), _=Depends(require_admin)):
    query = db.query(models.User)
    if q: query = query.filter(models.User.name.ilike(f"%{q}%") | models.User.email.ilike(f"%{q}%"))
    if role: query = query.filter(models.User.role == role)
    total = query.count()
    users = query.order_by(models.User.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return schemas.UserListOut(total=total, users=users)

@router.put("/users/{uid}/role")
def set_role(uid: int, role: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    if role not in [r.value for r in models.UserRole]: raise HTTPException(400, "Invalid role")
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user: raise HTTPException(404, "User not found")
    user.role = role
    if role == "organizer" and not db.query(models.OrganizerProfile).filter(models.OrganizerProfile.user_id == uid).first():
        db.add(models.OrganizerProfile(user_id=uid))
    db.commit()
    notify(db, uid, "Role Updated", f"Your account role has been updated to {role}.", "info")
    return {"message": f"Role updated to {role}"}

@router.put("/users/{uid}/activate")
def activate_user(uid: int, active: bool, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user: raise HTTPException(404, "User not found")
    user.is_active = active; db.commit()
    return {"message": f"User {'activated' if active else 'deactivated'}"}

# Frontend calls POST /users/{id}/toggle to flip active status
@router.post("/users/{uid}/toggle")
def toggle_user(uid: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user: raise HTTPException(404, "User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}

@router.delete("/users/{uid}", status_code=204)
def delete_user(uid: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == uid).first()
    if not user: raise HTTPException(404, "User not found")
    db.delete(user); db.commit()

# ── Events ────────────────────────────────────────────────────
@router.get("/events", response_model=schemas.EventListOut)
def all_events(q: Optional[str] = None, status: Optional[str] = None, page: int = 1, limit: int = 20, db: Session = Depends(get_db), _=Depends(require_admin)):
    from app.routers.events import _enrich
    query = db.query(models.Event)
    if q: query = query.filter(models.Event.title.ilike(f"%{q}%"))
    if status: query = query.filter(models.Event.status == status)
    total = query.count()
    events = query.order_by(models.Event.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return schemas.EventListOut(total=total, page=page, limit=limit, events=[_enrich(e, db) for e in events])

# Frontend calls PUT /admin/events/{id} with body {status: ...}
@router.put("/events/{eid}")
def update_event_generic(eid: int, payload: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    e = db.query(models.Event).filter(models.Event.id == eid).first()
    if not e: raise HTTPException(404, "Not found")
    if "status" in payload:
        if payload["status"] not in [s.value for s in models.EventStatus]: raise HTTPException(400, "Invalid status")
        e.status = payload["status"]
    if "is_featured" in payload:
        e.is_featured = payload["is_featured"]
    db.commit()
    return {"message": "Event updated"}

@router.put("/events/{eid}/feature")
def feature_event(eid: int, is_featured: bool, db: Session = Depends(get_db), _=Depends(require_admin)):
    e = db.query(models.Event).filter(models.Event.id == eid).first()
    if not e: raise HTTPException(404, "Not found")
    e.is_featured = is_featured; db.commit()
    return {"message": f"Event {'featured' if is_featured else 'unfeatured'}"}

@router.put("/events/{eid}/status")
def set_status(eid: int, status: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    if status not in [s.value for s in models.EventStatus]: raise HTTPException(400, "Invalid status")
    e = db.query(models.Event).filter(models.Event.id == eid).first()
    if not e: raise HTTPException(404, "Not found")
    e.status = status; db.commit()
    return {"message": f"Status → {status}"}

# ── Bookings ──────────────────────────────────────────────────
@router.get("/bookings", response_model=schemas.BookingListOut)
def all_bookings(page: int = 1, limit: int = 20, db: Session = Depends(get_db), _=Depends(require_admin)):
    from app.routers.bookings import _out
    total = db.query(models.Booking).count()
    bookings = db.query(models.Booking).order_by(models.Booking.booked_at.desc()).offset((page-1)*limit).limit(limit).all()
    return schemas.BookingListOut(total=total, bookings=[_out(b) for b in bookings])

# ── Refunds ───────────────────────────────────────────────────
@router.get("/refunds")
def all_refunds(status: Optional[str] = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    q = db.query(models.Refund)
    if status: q = q.filter(models.Refund.status == status)
    refunds = q.order_by(models.Refund.created_at.desc()).all()
    return [schemas.RefundOut.model_validate(r) for r in refunds]

# Frontend calls POST /admin/refunds/{id}/process with {approved: bool, admin_note: str}
@router.post("/refunds/{rid}/process")
@router.put("/refunds/{rid}")
def process_refund(rid: int, payload: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    refund = db.query(models.Refund).filter(models.Refund.id == rid).first()
    if not refund: raise HTTPException(404, "Not found")
    # Support both {approved: bool} (frontend) and {status: str} (API) formats
    if "approved" in payload:
        status = "approved" if payload["approved"] else "rejected"
    elif "status" in payload:
        status = payload["status"]
    else:
        raise HTTPException(400, "Provide 'approved' (bool) or 'status' field")
    admin_note = payload.get("admin_note")
    refund.status = status
    refund.admin_note = admin_note
    if status == "approved":
        refund.processed_at = datetime.now(timezone.utc)
        booking = db.query(models.Booking).filter(models.Booking.id == refund.booking_id).first()
        if booking: booking.status = models.BookingStatus.refunded
        notify(db, refund.user_id, "Refund Approved ✅", f"Your refund of ₹{refund.amount:.0f} has been approved.", "success")
    elif status == "rejected":
        notify(db, refund.user_id, "Refund Rejected", f"Your refund request was rejected. Reason: {admin_note or 'N/A'}", "error")
    db.commit()
    return schemas.RefundOut.model_validate(refund)

# ── Messages / Contacts (both endpoints for frontend compat) ──
@router.get("/messages")
@router.get("/contacts")
def messages(page: int = 1, limit: int = 20, unread: bool = False, db: Session = Depends(get_db), _=Depends(require_admin)):
    q = db.query(models.ContactMessage)
    if unread: q = q.filter(models.ContactMessage.is_read == False)
    msgs = q.order_by(models.ContactMessage.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return [schemas.ContactOut.model_validate(m) for m in msgs]

@router.put("/messages/{mid}/read")
def mark_read(mid: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    m = db.query(models.ContactMessage).filter(models.ContactMessage.id == mid).first()
    if not m: raise HTTPException(404, "Not found")
    m.is_read = True; db.commit()
    return {"message": "Marked as read"}

# ── Coupons ───────────────────────────────────────────────────
@router.get("/coupons")
def all_coupons(db: Session = Depends(get_db), _=Depends(require_admin)):
    coupons = db.query(models.Coupon).order_by(models.Coupon.created_at.desc()).all()
    return [schemas.CouponOut.model_validate(c) for c in coupons]

# ── Newsletter ────────────────────────────────────────────────
@router.get("/newsletter-subscribers")
@router.get("/newsletter")
def newsletter_subs(db: Session = Depends(get_db), _=Depends(require_admin)):
    subs = db.query(models.NewsletterSubscriber).filter(models.NewsletterSubscriber.is_active == True).all()
    return {"total": len(subs), "subscribers": [{"email": s.email, "name": s.name, "categories": s.categories, "subscribed_at": str(s.subscribed_at)} for s in subs]}

# ── Activity Log ──────────────────────────────────────────────
@router.get("/activity-log")
def activity_log(page: int = 1, limit: int = 50, db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(models.UserActivity).count()
    acts = db.query(models.UserActivity).order_by(models.UserActivity.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return {"total": total, "activities": [{"id": a.id, "user_id": a.user_id, "action": a.action, "entity_type": a.entity_type, "entity_id": a.entity_id, "created_at": str(a.created_at)} for a in acts]}

# ── Revenue Analytics ─────────────────────────────────────────
@router.get("/revenue-analytics")
def revenue_analytics(days: int = 30, db: Session = Depends(get_db), _=Depends(require_admin)):
    from collections import defaultdict
    start = datetime.now(timezone.utc) - timedelta(days=days)
    bookings = db.query(models.Booking).filter(models.Booking.booked_at >= start, models.Booking.status != "cancelled").all()
    daily = defaultdict(float)
    by_category = defaultdict(float)
    for b in bookings:
        daily[b.booked_at.strftime("%Y-%m-%d")] += b.total_amount
        if b.event: by_category[b.event.category] += b.total_amount
    return {
        "daily_revenue":  [{"date": k, "revenue": round(v, 2)} for k, v in sorted(daily.items())],
        "by_category":    [{"category": k, "revenue": round(v, 2)} for k, v in sorted(by_category.items(), key=lambda x: -x[1])],
        "total":          round(sum(daily.values()), 2),
    }
