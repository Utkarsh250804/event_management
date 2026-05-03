import re, uuid, base64, io
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import models

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return re.sub(r'^-+|-+$', '', text)

def unique_slug(db: Session, title: str, model_class) -> str:
    base = slugify(title)
    slug, i = base, 1
    while db.query(model_class).filter(model_class.slug == slug).first():
        slug = f"{base}-{i}"; i += 1
    return slug

def generate_ticket_id(event_id: int, user_id: int) -> str:
    uid = uuid.uuid4().hex[:8].upper()
    ts = datetime.utcnow().strftime("%y%m%d")
    return f"EF-{event_id:04d}-{user_id:05d}-{ts}-{uid}"

def generate_qr_code(data: str) -> str:
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=6, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0A0A0F", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except:
        return f"QR:{data}"

def resolve_price(event: models.Event, ticket_type: str) -> float:
    # Check early bird
    now = datetime.now(timezone.utc)
    if (event.early_bird_price and event.early_bird_deadline and
            now < event.early_bird_deadline and ticket_type == "standard"):
        return round(event.early_bird_price, 2)
    prices = {
        "standard": event.standard_price,
        "premium":  event.premium_price or round(event.standard_price * 1.4, 2),
        "vip":      event.vip_price or round(event.standard_price * 2.0, 2),
    }
    return round(prices.get(ticket_type, event.standard_price), 2)

def apply_coupon(db: Session, code: str, event_id: int, amount: float, user_id: int):
    """Returns (discount_amount, coupon_obj) or raises ValueError."""
    from app.models import Coupon, CouponUsage
    now = datetime.now(timezone.utc)
    coupon = db.query(Coupon).filter(Coupon.code == code.upper(), Coupon.is_active == True).first()
    if not coupon:
        raise ValueError("Invalid coupon code")
    if coupon.event_id and coupon.event_id != event_id:
        raise ValueError("Coupon not valid for this event")
    if coupon.valid_from and now < coupon.valid_from:
        raise ValueError("Coupon not yet active")
    if coupon.valid_until and now > coupon.valid_until:
        raise ValueError("Coupon has expired")
    if coupon.max_uses and coupon.used_count >= coupon.max_uses:
        raise ValueError("Coupon usage limit reached")
    if amount < coupon.min_order_amount:
        raise ValueError(f"Minimum order ₹{coupon.min_order_amount:.0f} required")
    # Check user already used
    used = db.query(CouponUsage).filter(CouponUsage.coupon_id == coupon.id, CouponUsage.user_id == user_id).first()
    if used:
        raise ValueError("You have already used this coupon")
    if coupon.type == "percentage":
        discount = round(amount * coupon.value / 100, 2)
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:
        discount = min(coupon.value, amount)
    return round(discount, 2), coupon

def notify(db: Session, user_id: int, title: str, message: str, type="info", link=None, icon=None):
    n = models.Notification(user_id=user_id, title=title, message=message, type=type, link=link, icon=icon)
    db.add(n)
    db.commit()

def log_activity(db: Session, user_id: int, action: str, entity_type: str = None, entity_id: int = None, meta: dict = None, ip: str = None):
    a = models.UserActivity(user_id=user_id, action=action, entity_type=entity_type, entity_id=entity_id, meta=meta, ip_address=ip)
    db.add(a)
    db.commit()
