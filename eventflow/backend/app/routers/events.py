from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
import os, uuid

from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user, require_organizer, get_optional_user
from app.utils.helpers import unique_slug, notify

router = APIRouter()


def _enrich(e: models.Event, db: Session) -> schemas.EventOut:
    avg = db.query(func.avg(models.Review.rating)).filter(models.Review.event_id == e.id).scalar()
    cnt = db.query(func.count(models.Review.id)).filter(models.Review.event_id == e.id).scalar()
    out = schemas.EventOut.model_validate(e)
    out.avg_rating = round(float(avg), 1) if avg else None
    out.review_count = cnt or 0
    return out


# ── Public Endpoints ──────────────────────────────────────
@router.get("", response_model=schemas.EventListOut)
def list_events(
    q: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    status: str = "published",
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_online: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort: str = Query("date_asc", enum=["date_asc","date_desc","price_asc","price_desc","popular","newest"]),
    page: int = Query(1, ge=1),
    limit: int = Query(9, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(models.Event)
    if status:
        query = query.filter(models.Event.status == status)
    if q:
        query = query.filter(or_(
            models.Event.title.ilike(f"%{q}%"),
            models.Event.description.ilike(f"%{q}%"),
            models.Event.venue_name.ilike(f"%{q}%"),
            models.Event.city.ilike(f"%{q}%"),
            models.Event.organizer_name.ilike(f"%{q}%"),
        ))
    if category:
        query = query.filter(models.Event.category == category)
    if city:
        query = query.filter(models.Event.city.ilike(f"%{city}%"))
    if min_price is not None:
        query = query.filter(models.Event.standard_price >= min_price)
    if max_price is not None:
        query = query.filter(models.Event.standard_price <= max_price)
    if is_online is not None:
        query = query.filter(models.Event.is_online == is_online)
    if is_featured is not None:
        query = query.filter(models.Event.is_featured == is_featured)
    if date_from:
        from datetime import datetime
        query = query.filter(models.Event.event_date >= datetime.fromisoformat(date_from))
    if date_to:
        from datetime import datetime
        query = query.filter(models.Event.event_date <= datetime.fromisoformat(date_to))

    sort_map = {
        "date_asc":   models.Event.event_date.asc(),
        "date_desc":  models.Event.event_date.desc(),
        "price_asc":  models.Event.standard_price.asc(),
        "price_desc": models.Event.standard_price.desc(),
        "popular":    models.Event.booked_seats.desc(),
        "newest":     models.Event.created_at.desc(),
    }
    query = query.order_by(sort_map.get(sort, models.Event.event_date.asc()))

    total = query.count()
    events = query.offset((page-1)*limit).limit(limit).all()
    return schemas.EventListOut(total=total, page=page, limit=limit, events=[_enrich(e, db) for e in events])


@router.get("/featured", response_model=List[schemas.EventOut])
def featured(limit: int = 6, db: Session = Depends(get_db)):
    events = db.query(models.Event).filter(
        models.Event.status == "published", models.Event.is_featured == True
    ).order_by(models.Event.booked_seats.desc()).limit(limit).all()
    if not events:
        events = db.query(models.Event).filter(models.Event.status == "published").order_by(models.Event.booked_seats.desc()).limit(limit).all()
    return [_enrich(e, db) for e in events]


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    results = db.query(models.Event.category, func.count(models.Event.id).label("count")).filter(
        models.Event.status == "published"
    ).group_by(models.Event.category).all()
    return [{"category": r.category, "count": r.count} for r in results]


@router.get("/cities")
def cities(db: Session = Depends(get_db)):
    results = db.query(models.Event.city, func.count(models.Event.id).label("count")).filter(
        models.Event.status == "published", models.Event.city != None
    ).group_by(models.Event.city).order_by(func.count(models.Event.id).desc()).limit(20).all()
    return [{"city": r.city, "count": r.count} for r in results]


@router.get("/trending", response_model=List[schemas.EventOut])
def trending(limit: int = 6, db: Session = Depends(get_db)):
    events = db.query(models.Event).filter(models.Event.status == "published").order_by(
        models.Event.view_count.desc(), models.Event.booked_seats.desc()
    ).limit(limit).all()
    return [_enrich(e, db) for e in events]


@router.get("/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: int, request: Request, db: Session = Depends(get_db), user: Optional[models.User] = Depends(get_optional_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    # Record view
    event.view_count = (event.view_count or 0) + 1
    view = models.EventView(
        event_id=event_id,
        user_id=user.id if user else None,
        ip_address=request.client.host if request.client else None,
    )
    db.add(view); db.commit()
    return _enrich(event, db)


@router.get("/slug/{slug}", response_model=schemas.EventOut)
def get_by_slug(slug: str, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.slug == slug).first()
    if not event:
        raise HTTPException(404, "Event not found")
    return _enrich(event, db)


# ── Organizer Endpoints ───────────────────────────────────
@router.post("", response_model=schemas.EventOut, status_code=201)
def create_event(payload: schemas.EventCreate, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    slug = unique_slug(db, payload.title, models.Event)
    data = payload.model_dump(exclude={"status", "organizer_name"})
    event = models.Event(
        **data,
        slug=slug,
        organizer_id=u.id,
        organizer_name=payload.organizer_name or u.name,
        status=payload.status,
    )
    db.add(event); db.commit(); db.refresh(event)
    return _enrich(event, db)


@router.put("/{event_id}", response_model=schemas.EventOut)
def update_event(event_id: int, payload: schemas.EventUpdate, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    event = _get_own_event(event_id, u, db)
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(event, k, v)
    db.commit(); db.refresh(event)
    return _enrich(event, db)


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    event = _get_own_event(event_id, u, db)
    db.delete(event); db.commit()


@router.post("/{event_id}/publish", response_model=schemas.EventOut)
def publish_event(event_id: int, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    from datetime import datetime, timezone
    event = _get_own_event(event_id, u, db)
    event.status = models.EventStatus.published
    event.published_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(event)
    return _enrich(event, db)


@router.post("/{event_id}/banner")
async def upload_banner(event_id: int, file: UploadFile = File(...), u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    event = _get_own_event(event_id, u, db)
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        raise HTTPException(400, "Invalid image type")
    name = f"banner_{event_id}_{uuid.uuid4().hex[:8]}.{ext}"
    path = os.path.join("uploads", name)
    with open(path, "wb") as f:
        f.write(await file.read())
    event.banner_url = f"/uploads/{name}"
    db.commit()
    return {"banner_url": event.banner_url}


# ── Schedules ─────────────────────────────────────────────
@router.get("/{event_id}/schedules", response_model=List[schemas.ScheduleOut])
def get_schedules(event_id: int, db: Session = Depends(get_db)):
    return db.query(models.EventSchedule).filter(models.EventSchedule.event_id == event_id).order_by(models.EventSchedule.day_number, models.EventSchedule.start_time).all()


@router.post("/{event_id}/schedules", response_model=schemas.ScheduleOut, status_code=201)
def add_schedule(event_id: int, payload: schemas.ScheduleCreate, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    _get_own_event(event_id, u, db)
    s = models.EventSchedule(event_id=event_id, **payload.model_dump())
    db.add(s); db.commit(); db.refresh(s)
    return s


@router.delete("/{event_id}/schedules/{schedule_id}", status_code=204)
def delete_schedule(event_id: int, schedule_id: int, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    s = db.query(models.EventSchedule).filter(models.EventSchedule.id == schedule_id, models.EventSchedule.event_id == event_id).first()
    if not s: raise HTTPException(404, "Schedule not found")
    db.delete(s); db.commit()


# ── Reviews ───────────────────────────────────────────────
@router.get("/{event_id}/reviews", response_model=List[schemas.ReviewOut])
def get_reviews(event_id: int, db: Session = Depends(get_db)):
    reviews = db.query(models.Review).filter(models.Review.event_id == event_id).order_by(models.Review.created_at.desc()).all()
    result = []
    for r in reviews:
        out = schemas.ReviewOut.model_validate(r)
        out.user_name = r.user.name if r.user else "Anonymous"
        out.user_avatar = r.user.avatar_url if r.user else None
        result.append(out)
    return result


@router.post("/{event_id}/reviews", response_model=schemas.ReviewOut, status_code=201)
def add_review(event_id: int, payload: schemas.ReviewCreate, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    has_booking = db.query(models.Booking).filter(
        models.Booking.event_id == event_id, models.Booking.user_id == u.id,
        models.Booking.status.in_(["confirmed", "attended"])
    ).first()
    if not has_booking:
        raise HTTPException(403, "You must attend this event to review it")
    if db.query(models.Review).filter(models.Review.event_id == event_id, models.Review.user_id == u.id).first():
        raise HTTPException(400, "You have already reviewed this event")
    r = models.Review(user_id=u.id, event_id=event_id, rating=payload.rating, comment=payload.comment, is_verified=True)
    db.add(r); db.commit(); db.refresh(r)
    out = schemas.ReviewOut.model_validate(r)
    out.user_name = u.name; out.user_avatar = u.avatar_url
    return out


@router.post("/{event_id}/reviews/{review_id}/helpful")
def mark_helpful(event_id: int, review_id: int, db: Session = Depends(get_db)):
    r = db.query(models.Review).filter(models.Review.id == review_id, models.Review.event_id == event_id).first()
    if not r: raise HTTPException(404, "Review not found")
    r.helpful_count = (r.helpful_count or 0) + 1
    db.commit()
    return {"helpful_count": r.helpful_count}


# ── Wishlist ──────────────────────────────────────────────
@router.post("/{event_id}/wishlist", status_code=201)
def add_wishlist(event_id: int, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if db.query(models.Wishlist).filter(models.Wishlist.user_id == u.id, models.Wishlist.event_id == event_id).first():
        raise HTTPException(400, "Already in wishlist")
    db.add(models.Wishlist(user_id=u.id, event_id=event_id))
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event:
        event.wishlist_count = (event.wishlist_count or 0) + 1
    db.commit()
    return {"message": "Added to wishlist"}


@router.delete("/{event_id}/wishlist")
def remove_wishlist(event_id: int, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(models.Wishlist).filter(models.Wishlist.user_id == u.id, models.Wishlist.event_id == event_id).first()
    if not item: raise HTTPException(404, "Not in wishlist")
    db.delete(item)
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event:
        event.wishlist_count = max(0, (event.wishlist_count or 1) - 1)
    db.commit()
    return {"message": "Removed from wishlist"}


@router.get("/{event_id}/wishlist/check")
def check_wishlist(event_id: int, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    in_list = db.query(models.Wishlist).filter(models.Wishlist.user_id == u.id, models.Wishlist.event_id == event_id).first()
    return {"in_wishlist": bool(in_list)}


# ── Coupon validate ───────────────────────────────────────
@router.post("/{event_id}/coupon/validate", response_model=schemas.CouponValidateOut)
def validate_coupon(event_id: int, payload: schemas.CouponValidate, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.utils.helpers import apply_coupon
    try:
        discount, _ = apply_coupon(db, payload.code, event_id, payload.amount, u.id)
        return schemas.CouponValidateOut(valid=True, discount_amount=discount, message=f"Coupon applied! You save ₹{discount:.0f}", final_amount=round(payload.amount - discount, 2))
    except ValueError as e:
        return schemas.CouponValidateOut(valid=False, discount_amount=0, message=str(e))


def _get_own_event(event_id: int, u: models.User, db: Session) -> models.Event:
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event: raise HTTPException(404, "Event not found")
    if event.organizer_id != u.id and u.role != models.UserRole.admin:
        raise HTTPException(403, "Not your event")
    return event
