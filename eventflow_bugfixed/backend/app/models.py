"""
EventFlow — Complete Database Models
New additions: Coupon, Payment, EventSchedule, OrganizerProfile,
               UserActivity, EventView, Refund, Newsletter
"""
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, Enum, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


# ── Enums ─────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    user = "user"
    organizer = "organizer"
    admin = "admin"

class EventStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    cancelled = "cancelled"
    completed = "completed"
    suspended = "suspended"

class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    attended = "attended"
    refunded = "refunded"

class TicketType(str, enum.Enum):
    standard = "standard"
    premium = "premium"
    vip = "vip"

class EventCategory(str, enum.Enum):
    music = "Music"
    tech = "Tech"
    sports = "Sports"
    food = "Food & Drink"
    arts = "Arts"
    business = "Business"
    education = "Education"
    health = "Health & Wellness"
    other = "Other"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    success = "success"
    failed = "failed"
    refunded = "refunded"

class CouponType(str, enum.Enum):
    percentage = "percentage"
    flat = "flat"

class RefundStatus(str, enum.Enum):
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    processed = "processed"


# ── User ──────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    avatar_url = Column(String(500))
    phone = Column(String(20))
    bio = Column(Text)
    city = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    login_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    bookings = relationship("Booking", foreign_keys="[Booking.user_id]", back_populates="user", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="organizer_user")
    wishlist = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    organizer_profile = relationship("OrganizerProfile", back_populates="user", uselist=False)
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", foreign_keys="[Payment.user_id]", back_populates="user")
    newsletter_sub = relationship("NewsletterSubscriber", back_populates="user", uselist=False)
    coupons_used = relationship("CouponUsage", back_populates="user")


# ── OrganizerProfile ──────────────────────────────────────
class OrganizerProfile(Base):
    __tablename__ = "organizer_profiles"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    organization_name = Column(String(200))
    website = Column(String(300))
    social_instagram = Column(String(200))
    social_twitter = Column(String(200))
    social_linkedin = Column(String(200))
    description = Column(Text)
    logo_url = Column(String(500))
    verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    total_events = Column(Integer, default=0)
    bank_account = Column(String(100))  # encrypted in production
    bank_ifsc = Column(String(20))
    pan_number = Column(String(20))
    gst_number = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="organizer_profile")


# ── Event ─────────────────────────────────────────────────
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    slug = Column(String(250), unique=True, index=True)
    short_description = Column(String(300))
    description = Column(Text, nullable=False)
    category = Column(Enum(EventCategory), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.draft)

    # Location
    venue_name = Column(String(200), nullable=False)
    venue_address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default="India")
    pincode = Column(String(10))
    latitude = Column(Float)
    longitude = Column(Float)
    is_online = Column(Boolean, default=False)
    online_link = Column(String(500))
    online_platform = Column(String(100))  # Zoom, Google Meet, etc.

    # Time
    event_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))
    timezone = Column(String(50), default="Asia/Kolkata")
    doors_open = Column(String(10))  # e.g. "18:30"

    # Tickets
    total_seats = Column(Integer, nullable=False, default=100)
    booked_seats = Column(Integer, default=0)
    standard_price = Column(Float, nullable=False)
    premium_price = Column(Float)
    vip_price = Column(Float)
    original_price = Column(Float)
    early_bird_price = Column(Float)
    early_bird_deadline = Column(DateTime(timezone=True))
    group_discount_min = Column(Integer)     # min tickets for group discount
    group_discount_pct = Column(Float)       # % discount

    # Media
    banner_url = Column(String(500))
    thumbnail_url = Column(String(500))
    icon_emoji = Column(String(10), default="🎪")
    gallery = Column(JSON, default=list)
    video_url = Column(String(500))

    # Meta
    highlights = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    faq = Column(JSON, default=list)          # [{q, a}]
    agenda = Column(JSON, default=list)       # [{time, title, speaker}]
    speakers = Column(JSON, default=list)     # [{name, title, bio, photo}]
    sponsors = Column(JSON, default=list)     # [{name, logo, tier}]
    badge = Column(String(50))
    is_featured = Column(Boolean, default=False)
    is_private = Column(Boolean, default=False)
    require_approval = Column(Boolean, default=False)
    min_age = Column(Integer)
    dress_code = Column(String(100))
    parking_info = Column(Text)
    refund_policy = Column(Text)
    cancellation_hours = Column(Integer, default=24)  # hours before event

    # Tracking
    view_count = Column(Integer, default=0)
    wishlist_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)

    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organizer_name = Column(String(200))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True))

    # Relationships
    organizer_user = relationship("User", back_populates="events")
    bookings = relationship("Booking", back_populates="event", cascade="all, delete-orphan")
    wishlist = relationship("Wishlist", back_populates="event", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="event", cascade="all, delete-orphan")
    schedules = relationship("EventSchedule", back_populates="event", cascade="all, delete-orphan")
    views = relationship("EventView", back_populates="event", cascade="all, delete-orphan")
    coupons = relationship("Coupon", back_populates="event", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_event_category_status", "category", "status"),
        Index("ix_event_date_status", "event_date", "status"),
    )

    @property
    def available_seats(self):
        return max(0, self.total_seats - self.booked_seats)

    @property
    def booking_percentage(self):
        if self.total_seats == 0:
            return 0
        return round((self.booked_seats / self.total_seats) * 100, 1)

    @property
    def is_sold_out(self):
        return self.booked_seats >= self.total_seats


# ── EventSchedule ─────────────────────────────────────────
class EventSchedule(Base):
    __tablename__ = "event_schedules"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    day_number = Column(Integer, default=1)
    start_time = Column(String(10))
    end_time = Column(String(10))
    title = Column(String(200))
    description = Column(Text)
    speaker = Column(String(100))
    location = Column(String(200))  # sub-venue / stage

    event = relationship("Event", back_populates="schedules")


# ── Booking ───────────────────────────────────────────────
class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String(60), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))

    ticket_type = Column(Enum(TicketType), default=TicketType.standard)
    quantity = Column(Integer, default=1)
    price_per_ticket = Column(Float)
    original_price = Column(Float)          # before coupon
    discount_amount = Column(Float, default=0)
    total_amount = Column(Float)
    coupon_code = Column(String(30))

    status = Column(Enum(BookingStatus), default=BookingStatus.confirmed)
    payment_id = Column(String(100))        # Razorpay order/payment id
    payment_method = Column(String(50))

    qr_code_data = Column(Text)
    checked_in = Column(Boolean, default=False)
    checked_in_at = Column(DateTime(timezone=True))
    checked_in_by = Column(Integer, ForeignKey("users.id"))

    # Attendee
    attendee_name = Column(String(100))
    attendee_email = Column(String(255))
    attendee_phone = Column(String(20))
    special_requirements = Column(Text)

    # For group bookings
    group_name = Column(String(100))

    notes = Column(Text)
    booked_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="bookings", foreign_keys=[user_id])
    event = relationship("Event", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False)
    refund = relationship("Refund", back_populates="booking", uselist=False)


# ── Payment ───────────────────────────────────────────────
class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    razorpay_order_id = Column(String(100))
    razorpay_payment_id = Column(String(100))
    razorpay_signature = Column(String(255))
    amount = Column(Float)
    currency = Column(String(5), default="INR")
    method = Column(String(50))          # card, upi, netbanking, wallet
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    gateway_response = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    booking = relationship("Booking", back_populates="payment")
    user = relationship("User", back_populates="payments")


# ── Refund ────────────────────────────────────────────────
class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    reason = Column(Text)
    status = Column(Enum(RefundStatus), default=RefundStatus.requested)
    admin_note = Column(Text)
    processed_at = Column(DateTime(timezone=True))
    razorpay_refund_id = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Booking", back_populates="refund")
    user = relationship("User", foreign_keys=[user_id])


# ── Coupon ────────────────────────────────────────────────
class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True)
    code = Column(String(30), unique=True, index=True)
    type = Column(Enum(CouponType), default=CouponType.percentage)
    value = Column(Float)               # % or flat INR
    max_discount = Column(Float)        # cap for percentage coupons
    min_order_amount = Column(Float, default=0)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=True)  # None = global
    valid_from = Column(DateTime(timezone=True))
    valid_until = Column(DateTime(timezone=True))
    max_uses = Column(Integer)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="coupons")
    usages = relationship("CouponUsage", back_populates="coupon")


class CouponUsage(Base):
    __tablename__ = "coupon_usages"

    id = Column(Integer, primary_key=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    discount_applied = Column(Float)
    used_at = Column(DateTime(timezone=True), server_default=func.now())

    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User", back_populates="coupons_used")


# ── Wishlist ──────────────────────────────────────────────
class Wishlist(Base):
    __tablename__ = "wishlist"
    __table_args__ = (UniqueConstraint("user_id", "event_id"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="wishlist")
    event = relationship("Event", back_populates="wishlist")


# ── Review ────────────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("user_id", "event_id"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    rating = Column(Integer)
    comment = Column(Text)
    is_verified = Column(Boolean, default=False)   # attended the event
    helpful_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")
    event = relationship("Event", back_populates="reviews")


# ── Notification ──────────────────────────────────────────
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200))
    message = Column(Text)
    type = Column(String(30), default="info")   # info|success|warning|error
    is_read = Column(Boolean, default=False)
    link = Column(String(500))
    icon = Column(String(10))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


# ── EventView (analytics) ─────────────────────────────────
class EventView(Base):
    __tablename__ = "event_views"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip_address = Column(String(45))
    user_agent = Column(String(300))
    source = Column(String(100))          # direct, search, share, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="views")


# ── UserActivity ──────────────────────────────────────────
class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))          # login, book, cancel, wishlist, review
    entity_type = Column(String(50))      # event, booking, etc.
    entity_id = Column(Integer)
    meta = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="activities")


# ── ContactMessage ────────────────────────────────────────
class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(255))
    subject = Column(String(200))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    replied_at = Column(DateTime(timezone=True))
    reply_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ── NewsletterSubscriber ──────────────────────────────────
class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100))
    categories = Column(JSON, default=list)   # preferred categories
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True))

    user = relationship("User", back_populates="newsletter_sub")