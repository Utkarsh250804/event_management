from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app import models, schemas
from app.utils.auth import get_current_user, require_organizer
from app.utils.helpers import generate_ticket_id, generate_qr_code, resolve_price, apply_coupon, notify, log_activity
from app.services.email_service import send_booking_confirmation, send_cancellation_email

router = APIRouter()


def _out(b: models.Booking) -> schemas.BookingOut:
    out = schemas.BookingOut.model_validate(b)
    if b.event:
        out.event_title    = b.event.title
        out.event_date     = b.event.event_date
        out.event_location = b.event.venue_name
        out.event_icon     = b.event.icon_emoji
    return out


@router.post("", response_model=schemas.BookingOut, status_code=201)
def create_booking(payload: schemas.BookingCreate, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == payload.event_id, models.Event.status == "published").first()
    if not event:
        raise HTTPException(404, "Event not found or not available for booking")
    if event.available_seats < payload.quantity:
        raise HTTPException(400, f"Only {event.available_seats} seats available")

    price = resolve_price(event, payload.ticket_type.value)
    original_total = round(price * payload.quantity, 2)
    discount = 0.0
    coupon_obj = None

    if payload.coupon_code:
        try:
            discount, coupon_obj = apply_coupon(db, payload.coupon_code, event.id, original_total, u.id)
        except ValueError as e:
            raise HTTPException(400, str(e))

    total = round(original_total - discount, 2)
    ticket_id = generate_ticket_id(event.id, u.id)
    qr = generate_qr_code(ticket_id)

    booking = models.Booking(
        ticket_id=ticket_id,
        user_id=u.id, event_id=event.id,
        ticket_type=payload.ticket_type,
        quantity=payload.quantity,
        price_per_ticket=price,
        original_price=original_total,
        discount_amount=discount,
        total_amount=total,
        coupon_code=payload.coupon_code.upper() if payload.coupon_code else None,
        status=models.BookingStatus.confirmed,
        qr_code_data=qr,
        attendee_name=payload.attendee_name or u.name,
        attendee_email=payload.attendee_email or u.email,
        attendee_phone=payload.attendee_phone or u.phone,
        special_requirements=payload.special_requirements,
        group_name=payload.group_name,
    )

    event.booked_seats += payload.quantity

    if coupon_obj:
        coupon_obj.used_count = (coupon_obj.used_count or 0) + 1
        db.add(models.CouponUsage(coupon_id=coupon_obj.id, user_id=u.id, discount_applied=discount))

    db.add(booking); db.commit(); db.refresh(booking)

    # Notifications
    notify(db, u.id, "Booking Confirmed! 🎟", f"{payload.quantity} ticket(s) for '{event.title}' confirmed. ID: {ticket_id}", "success", "/pages/dashboard.html", "🎟")
    notify(db, event.organizer_id, "New Booking 📈", f"{u.name} booked {payload.quantity} ticket(s) for '{event.title}'", "info", "/pages/organizer.html")
    log_activity(db, u.id, "book", "event", event.id, {"ticket_id": ticket_id, "quantity": payload.quantity})
    send_booking_confirmation(u.email, u.name, event.title, ticket_id, str(event.event_date), event.venue_name, total)

    return _out(booking)


@router.get("", response_model=schemas.BookingListOut)
def my_bookings(status: str = None, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    q = db.query(models.Booking).filter(models.Booking.user_id == u.id)
    if status:
        q = q.filter(models.Booking.status == status)
    bookings = q.order_by(models.Booking.booked_at.desc()).all()
    return schemas.BookingListOut(total=len(bookings), bookings=[_out(b) for b in bookings])


# Alias: frontend calls GET /bookings/my
@router.get("/my", response_model=schemas.BookingListOut)
def my_bookings_alias(status: str = None, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return my_bookings(status=status, u=u, db=db)


@router.get("/{ticket_id}", response_model=schemas.BookingOut)
def get_booking(ticket_id: str, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.ticket_id == ticket_id).first()
    if not b: raise HTTPException(404, "Ticket not found")
    if b.user_id != u.id and u.role == models.UserRole.user:
        raise HTTPException(403, "Access denied")
    return _out(b)


@router.post("/{ticket_id}/cancel", response_model=schemas.BookingOut)
def cancel_booking(ticket_id: str, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Support both ticket_id string and numeric booking id
    if ticket_id.isdigit():
        b = db.query(models.Booking).filter(models.Booking.id == int(ticket_id), models.Booking.user_id == u.id).first()
    else:
        b = db.query(models.Booking).filter(models.Booking.ticket_id == ticket_id, models.Booking.user_id == u.id).first()
    if not b: raise HTTPException(404, "Booking not found")
    if b.status == models.BookingStatus.cancelled:
        raise HTTPException(400, "Already cancelled")
    # Check cancellation window
    event = db.query(models.Event).filter(models.Event.id == b.event_id).first()
    if event:
        from datetime import timedelta
        cancel_deadline = event.event_date - timedelta(hours=event.cancellation_hours or 24)
        if datetime.now(timezone.utc) > cancel_deadline.replace(tzinfo=timezone.utc) if cancel_deadline.tzinfo is None else cancel_deadline:
            raise HTTPException(400, f"Cancellation window closed (must cancel {event.cancellation_hours}h before event)")
        event.booked_seats = max(0, event.booked_seats - b.quantity)

    b.status = models.BookingStatus.cancelled
    db.commit(); db.refresh(b)

    notify(db, u.id, "Booking Cancelled", f"Your booking for '{b.event.title}' has been cancelled.", "warning", "/pages/dashboard.html")
    log_activity(db, u.id, "cancel", "booking", b.id)
    send_cancellation_email(u.email, u.name, b.event.title, ticket_id)
    return _out(b)


@router.post("/checkin", response_model=schemas.BookingOut)
def check_in(payload: schemas.CheckInRequest, u: models.User = Depends(require_organizer), db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.ticket_id == payload.ticket_id).first()
    if not b: raise HTTPException(404, "Ticket not found")
    if b.status == models.BookingStatus.cancelled: raise HTTPException(400, "Ticket is cancelled")
    if b.checked_in: raise HTTPException(400, f"Already checked in at {b.checked_in_at}")
    event = db.query(models.Event).filter(models.Event.id == b.event_id).first()
    if event.organizer_id != u.id and u.role != models.UserRole.admin:
        raise HTTPException(403, "Not your event")
    b.checked_in = True
    b.checked_in_at = datetime.now(timezone.utc)
    b.checked_in_by = u.id
    b.status = models.BookingStatus.attended
    db.commit(); db.refresh(b)
    log_activity(db, u.id, "checkin", "booking", b.id, {"ticket_id": payload.ticket_id})
    return _out(b)


@router.get("/{ticket_id}/ticket")
def ticket_data(ticket_id: str, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.ticket_id == ticket_id).first()
    if not b: raise HTTPException(404, "Ticket not found")
    if b.user_id != u.id and u.role == models.UserRole.user: raise HTTPException(403, "Access denied")
    return {
        "ticket_id": b.ticket_id, "status": b.status, "ticket_type": b.ticket_type,
        "quantity": b.quantity, "total_amount": b.total_amount, "discount_amount": b.discount_amount,
        "coupon_code": b.coupon_code, "attendee_name": b.attendee_name,
        "qr_code": b.qr_code_data, "checked_in": b.checked_in, "checked_in_at": str(b.checked_in_at) if b.checked_in_at else None,
        "booked_at": str(b.booked_at),
        "event": {"title": b.event.title, "date": str(b.event.event_date), "venue": b.event.venue_name,
                  "icon": b.event.icon_emoji, "organizer": b.event.organizer_name, "city": b.event.city}
    }


@router.post("/refund/request", response_model=schemas.RefundOut, status_code=201)
def request_refund(payload: schemas.RefundRequest, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.query(models.Booking).filter(models.Booking.id == payload.booking_id, models.Booking.user_id == u.id).first()
    if not b: raise HTTPException(404, "Booking not found")
    if b.status != models.BookingStatus.cancelled: raise HTTPException(400, "Booking must be cancelled first")
    if db.query(models.Refund).filter(models.Refund.booking_id == b.id).first():
        raise HTTPException(400, "Refund already requested")
    refund = models.Refund(booking_id=b.id, user_id=u.id, amount=b.total_amount, reason=payload.reason)
    db.add(refund); db.commit(); db.refresh(refund)
    notify(db, u.id, "Refund Requested", f"Your refund of ₹{b.total_amount:.0f} has been submitted for review.", "info")
    return refund


# Alias: frontend calls POST /bookings/{id}/refund with {reason}
@router.post("/{booking_id}/refund", response_model=schemas.RefundOut, status_code=201)
def request_refund_by_id(booking_id: int, payload: schemas.RefundRequest, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    payload.booking_id = booking_id
    return request_refund(payload=payload, u=u, db=db)


# ── Coupon Validation ─────────────────────────────────────────
from pydantic import BaseModel as _PydanticBase

class CouponValidateIn(_PydanticBase):
    code: str
    event_id: int
    amount: float


@router.post("/coupon/validate")
def validate_coupon(payload: CouponValidateIn, u: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        discount, coupon = apply_coupon(db, payload.code, payload.event_id, payload.amount, u.id)
        return {
            "valid": True,
            "discount_amount": discount,
            "discount": discount,
            "code": payload.code.upper(),
            "type": coupon.type.value if coupon else None,
            "value": float(coupon.value) if coupon else None,
            "message": f"Coupon applied! You save ₹{discount:.0f}",
            "final_amount": round(payload.amount - discount, 2),
        }
    except Exception as e:
        raise HTTPException(400, detail=str(e))
