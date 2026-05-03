from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from collections import defaultdict

from app.database import get_db
from app import models, schemas
from app.utils.auth import require_organizer
from app.routers.events import _enrich
from app.routers.bookings import _out

router = APIRouter()

@router.get("/dashboard")
def dashboard(u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    events = db.query(models.Event).filter(models.Event.organizer_id == u.id).all()
    ids = [e.id for e in events]
    bookings = db.query(models.Booking).filter(models.Booking.event_id.in_(ids), models.Booking.status.in_(["confirmed", "attended"])).all()
    revenue = sum(b.total_amount for b in bookings)
    fill_rates = [e.booking_percentage for e in events if e.total_seats > 0]
    stats = {
        "total_events": len(events),
        "published_events": sum(1 for e in events if e.status == "published"),
        "draft_events": sum(1 for e in events if e.status == "draft"),
        "total_bookings": len(bookings),
        "confirmed_bookings": sum(1 for b in bookings if b.status == "confirmed"),
        "total_revenue": round(revenue, 2),
        "upcoming_events": sum(1 for e in events if e.event_date and e.event_date.replace(tzinfo=timezone.utc) > now),
        "avg_fill_rate": round(sum(fill_rates)/len(fill_rates), 1) if fill_rates else 0,
        "total_attendees": sum(b.quantity for b in bookings),
    }
    # Recent events with revenue
    recent_events = []
    for e in sorted(events, key=lambda x: x.created_at or now, reverse=True)[:5]:
        event_bookings = [b for b in bookings if b.event_id == e.id]
        event_revenue = sum(b.total_amount for b in event_bookings)
        ev = schemas.EventOut.model_validate(e)
        ev_dict = ev.model_dump()
        ev_dict["revenue"] = round(event_revenue, 2)
        recent_events.append(ev_dict)
    return {"stats": stats, "recent_events": recent_events}

@router.get("/events", response_model=schemas.EventListOut)
def my_events(page: int = 1, limit: int = 10, status: str = None, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    q = db.query(models.Event).filter(models.Event.organizer_id == u.id)
    if status: q = q.filter(models.Event.status == status)
    total = q.count()
    events = q.order_by(models.Event.created_at.desc()).offset((page-1)*limit).limit(limit).all()
    return schemas.EventListOut(total=total, page=page, limit=limit, events=[_enrich(e, db) for e in events])

@router.get("/events/{event_id}/bookings", response_model=schemas.BookingListOut)
def event_bookings(event_id: int, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.organizer_id == u.id).first()
    if not event: raise HTTPException(403, "Not your event")
    bookings = db.query(models.Booking).filter(models.Booking.event_id == event_id).order_by(models.Booking.booked_at.desc()).all()
    return schemas.BookingListOut(total=len(bookings), bookings=[_out(b) for b in bookings])

@router.get("/events/{event_id}/analytics")
def event_analytics(event_id: int, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id, models.Event.organizer_id == u.id).first()
    if not event: raise HTTPException(403, "Not your event")
    bookings = db.query(models.Booking).filter(models.Booking.event_id == event_id).all()
    confirmed = [b for b in bookings if b.status != "cancelled"]
    revenue = sum(b.total_amount for b in confirmed)
    ticket_breakdown = defaultdict(lambda: {"count": 0, "revenue": 0})
    for b in confirmed:
        ticket_breakdown[b.ticket_type.value]["count"] += b.quantity
        ticket_breakdown[b.ticket_type.value]["revenue"] += b.total_amount
    daily = defaultdict(int)
    for b in confirmed:
        daily[b.booked_at.strftime("%Y-%m-%d")] += b.quantity
    avg_rating = db.query(func.avg(models.Review.rating)).filter(models.Review.event_id == event_id).scalar()
    views_by_day = db.query(func.date(models.EventView.created_at), func.count(models.EventView.id)).filter(
        models.EventView.event_id == event_id
    ).group_by(func.date(models.EventView.created_at)).all()
    return {
        "event_id": event_id, "event_title": event.title,
        "total_seats": event.total_seats, "booked_seats": event.booked_seats,
        "available_seats": event.available_seats, "fill_rate": event.booking_percentage,
        "total_bookings": len(confirmed), "cancelled": len(bookings) - len(confirmed),
        "total_revenue": round(revenue, 2), "avg_rating": round(float(avg_rating), 1) if avg_rating else None,
        "ticket_breakdown": dict(ticket_breakdown),
        "booking_trend": [{"date": k, "tickets": v} for k, v in sorted(daily.items())],
        "view_trend": [{"date": str(d), "views": c} for d, c in views_by_day],
        "total_views": event.view_count or 0,
    }

@router.get("/revenue")
def revenue(u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    ids = [e.id for e in db.query(models.Event).filter(models.Event.organizer_id == u.id).all()]
    bookings = db.query(models.Booking).filter(models.Booking.event_id.in_(ids), models.Booking.status != "cancelled").all()
    monthly = defaultdict(float)
    for b in bookings:
        monthly[b.booked_at.strftime("%Y-%m")] += b.total_amount
    total = round(sum(monthly.values()), 2)
    now = datetime.now(timezone.utc)
    this_month_key = now.strftime("%Y-%m")
    this_month = round(monthly.get(this_month_key, 0.0), 2)
    num_events = len(ids) if ids else 1
    avg_per_event = round(total / num_events, 2) if ids else 0.0
    return {
        "monthly_revenue": [{"month": k, "revenue": round(v, 2)} for k, v in sorted(monthly.items())],
        "total": total,
        "total_revenue": total,
        "this_month": this_month,
        "avg_per_event": avg_per_event,
    }

@router.get("/profile", response_model=schemas.OrganizerProfileOut)
def get_profile(u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    p = db.query(models.OrganizerProfile).filter(models.OrganizerProfile.user_id == u.id).first()
    if not p: raise HTTPException(404, "Profile not found")
    return p

@router.put("/profile", response_model=schemas.OrganizerProfileOut)
def update_profile(payload: schemas.OrganizerProfileCreate, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    p = db.query(models.OrganizerProfile).filter(models.OrganizerProfile.user_id == u.id).first()
    if not p:
        p = models.OrganizerProfile(user_id=u.id)
        db.add(p)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit(); db.refresh(p)
    return p

@router.post("/coupons", response_model=schemas.CouponOut, status_code=201)
def create_coupon(payload: schemas.CouponCreate, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    if payload.event_id:
        event = db.query(models.Event).filter(models.Event.id == payload.event_id, models.Event.organizer_id == u.id).first()
        if not event: raise HTTPException(403, "Not your event")
    if db.query(models.Coupon).filter(models.Coupon.code == payload.code.upper()).first():
        raise HTTPException(400, "Coupon code already exists")
    c = models.Coupon(**payload.model_dump(exclude={"code"}), code=payload.code.upper(), created_by=u.id)
    db.add(c); db.commit(); db.refresh(c)
    return c

@router.get("/coupons", response_model=List[schemas.CouponOut])
def list_coupons(u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    return db.query(models.Coupon).filter(models.Coupon.created_by == u.id).order_by(models.Coupon.created_at.desc()).all()

@router.delete("/coupons/{coupon_id}", status_code=204)
def delete_coupon(coupon_id: int, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    c = db.query(models.Coupon).filter(models.Coupon.id == coupon_id, models.Coupon.created_by == u.id).first()
    if not c: raise HTTPException(404, "Not found")
    db.delete(c); db.commit()