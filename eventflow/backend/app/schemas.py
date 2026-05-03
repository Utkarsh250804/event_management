"""EventFlow — Complete Pydantic Schemas"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models import (
    UserRole, EventStatus, BookingStatus, TicketType,
    EventCategory, PaymentStatus, CouponType, RefundStatus
)


# ══════════════════ AUTH ══════════════════
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.user
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: "UserOut"

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


# ══════════════════ USER ══════════════════
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    avatar_url: Optional[str]
    phone: Optional[str]
    bio: Optional[str]
    city: Optional[str]
    is_active: bool
    is_verified: bool
    email_notifications: bool
    sms_notifications: bool
    created_at: datetime
    class Config: from_attributes = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    email_notifications: Optional[bool] = None
    sms_notifications: Optional[bool] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserListOut(BaseModel):
    total: int
    users: List[UserOut]


# ══════════════════ ORGANIZER PROFILE ══════════════════
class OrganizerProfileCreate(BaseModel):
    organization_name: Optional[str] = None
    website: Optional[str] = None
    social_instagram: Optional[str] = None
    social_twitter: Optional[str] = None
    social_linkedin: Optional[str] = None
    description: Optional[str] = None
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None

class OrganizerProfileOut(BaseModel):
    id: int
    user_id: int
    organization_name: Optional[str]
    website: Optional[str]
    social_instagram: Optional[str]
    social_twitter: Optional[str]
    social_linkedin: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]
    verified: bool
    rating: float
    total_events: int
    class Config: from_attributes = True


# ══════════════════ EVENT ══════════════════
class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    short_description: Optional[str] = None
    description: str = Field(..., min_length=10)
    category: EventCategory
    venue_name: str
    venue_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "India"
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_online: bool = False
    online_link: Optional[str] = None
    online_platform: Optional[str] = None
    event_date: datetime
    end_date: Optional[datetime] = None
    timezone: str = "Asia/Kolkata"
    doors_open: Optional[str] = None
    total_seats: int = Field(..., gt=0)
    standard_price: float = Field(..., ge=0)
    premium_price: Optional[float] = None
    vip_price: Optional[float] = None
    original_price: Optional[float] = None
    early_bird_price: Optional[float] = None
    early_bird_deadline: Optional[datetime] = None
    group_discount_min: Optional[int] = None
    group_discount_pct: Optional[float] = None
    icon_emoji: str = "🎪"
    highlights: List[str] = []
    tags: List[str] = []
    faq: List[Dict] = []
    agenda: List[Dict] = []
    speakers: List[Dict] = []
    sponsors: List[Dict] = []
    badge: Optional[str] = None
    is_featured: bool = False
    is_private: bool = False
    require_approval: bool = False
    min_age: Optional[int] = None
    dress_code: Optional[str] = None
    parking_info: Optional[str] = None
    refund_policy: Optional[str] = None
    cancellation_hours: int = 24
    organizer_name: Optional[str] = None
    status: EventStatus = EventStatus.draft

class EventUpdate(BaseModel):
    title: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    category: Optional[EventCategory] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    event_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_seats: Optional[int] = None
    standard_price: Optional[float] = None
    premium_price: Optional[float] = None
    vip_price: Optional[float] = None
    original_price: Optional[float] = None
    early_bird_price: Optional[float] = None
    early_bird_deadline: Optional[datetime] = None
    group_discount_min: Optional[int] = None
    group_discount_pct: Optional[float] = None
    highlights: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    faq: Optional[List[Dict]] = None
    agenda: Optional[List[Dict]] = None
    speakers: Optional[List[Dict]] = None
    sponsors: Optional[List[Dict]] = None
    badge: Optional[str] = None
    is_featured: Optional[bool] = None
    is_private: Optional[bool] = None
    dress_code: Optional[str] = None
    parking_info: Optional[str] = None
    refund_policy: Optional[str] = None
    cancellation_hours: Optional[int] = None
    organizer_name: Optional[str] = None
    status: Optional[EventStatus] = None

class EventOut(BaseModel):
    id: int
    title: str
    slug: str
    short_description: Optional[str]
    description: str
    category: str
    status: str
    venue_name: str
    venue_address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    is_online: bool
    online_link: Optional[str]
    online_platform: Optional[str]
    event_date: datetime
    end_date: Optional[datetime]
    timezone: Optional[str]
    doors_open: Optional[str]
    total_seats: int
    booked_seats: int
    available_seats: int
    booking_percentage: float
    is_sold_out: bool
    standard_price: float
    premium_price: Optional[float]
    vip_price: Optional[float]
    original_price: Optional[float]
    early_bird_price: Optional[float]
    early_bird_deadline: Optional[datetime]
    group_discount_min: Optional[int]
    group_discount_pct: Optional[float]
    banner_url: Optional[str]
    thumbnail_url: Optional[str]
    icon_emoji: Optional[str]
    gallery: List[Any] = []
    video_url: Optional[str]
    highlights: List[Any] = []
    tags: List[Any] = []
    faq: List[Any] = []
    agenda: List[Any] = []
    speakers: List[Any] = []
    sponsors: List[Any] = []
    badge: Optional[str]
    is_featured: bool
    is_private: bool
    min_age: Optional[int]
    dress_code: Optional[str]
    parking_info: Optional[str]
    refund_policy: Optional[str]
    cancellation_hours: Optional[int]
    view_count: int = 0
    wishlist_count: int = 0
    organizer_id: int
    organizer_name: Optional[str]
    avg_rating: Optional[float] = None
    review_count: int = 0
    created_at: datetime
    published_at: Optional[datetime]
    class Config: from_attributes = True

class EventListOut(BaseModel):
    total: int
    page: int
    limit: int
    events: List[EventOut]


# ══════════════════ BOOKING ══════════════════
class BookingCreate(BaseModel):
    event_id: int
    ticket_type: TicketType = TicketType.standard
    quantity: int = Field(..., ge=1, le=10)
    coupon_code: Optional[str] = None
    attendee_name: Optional[str] = None
    attendee_email: Optional[EmailStr] = None
    attendee_phone: Optional[str] = None
    special_requirements: Optional[str] = None
    group_name: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    ticket_id: str
    user_id: int
    event_id: int
    ticket_type: str
    quantity: int
    price_per_ticket: float
    original_price: Optional[float]
    discount_amount: float
    total_amount: float
    coupon_code: Optional[str]
    status: str
    payment_id: Optional[str]
    payment_method: Optional[str]
    qr_code_data: Optional[str]
    checked_in: bool
    checked_in_at: Optional[datetime]
    attendee_name: Optional[str]
    attendee_email: Optional[str]
    attendee_phone: Optional[str]
    special_requirements: Optional[str]
    booked_at: datetime
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    event_icon: Optional[str] = None
    class Config: from_attributes = True

class BookingListOut(BaseModel):
    total: int
    bookings: List[BookingOut]

class CheckInRequest(BaseModel):
    ticket_id: str


# ══════════════════ PAYMENT ══════════════════
class PaymentInitiate(BaseModel):
    booking_id: int

class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentOut(BaseModel):
    id: int
    booking_id: int
    amount: float
    currency: str
    method: Optional[str]
    status: str
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    created_at: datetime
    class Config: from_attributes = True


# ══════════════════ REFUND ══════════════════
class RefundRequest(BaseModel):
    booking_id: int
    reason: str = Field(..., min_length=10)

class RefundAction(BaseModel):
    status: RefundStatus
    admin_note: Optional[str] = None

class RefundOut(BaseModel):
    id: int
    booking_id: int
    amount: float
    reason: str
    status: str
    admin_note: Optional[str]
    processed_at: Optional[datetime]
    created_at: datetime
    class Config: from_attributes = True


# ══════════════════ COUPON ══════════════════
class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=30)
    type: CouponType
    value: float = Field(..., gt=0)
    max_discount: Optional[float] = None
    min_order_amount: float = 0
    event_id: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    max_uses: Optional[int] = None

class CouponValidate(BaseModel):
    code: str
    event_id: int
    amount: float

class CouponOut(BaseModel):
    id: int
    code: str
    type: str
    value: float
    max_discount: Optional[float]
    min_order_amount: float
    event_id: Optional[int]
    valid_until: Optional[datetime]
    max_uses: Optional[int]
    used_count: int
    is_active: bool
    class Config: from_attributes = True

class CouponValidateOut(BaseModel):
    valid: bool
    discount_amount: float
    message: str
    final_amount: Optional[float] = None


# ══════════════════ REVIEW ══════════════════
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    user_id: int
    event_id: int
    rating: int
    comment: Optional[str]
    is_verified: bool
    helpful_count: int
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    created_at: datetime
    class Config: from_attributes = True


# ══════════════════ SCHEDULE ══════════════════
class ScheduleCreate(BaseModel):
    day_number: int = 1
    start_time: str
    end_time: Optional[str] = None
    title: str
    description: Optional[str] = None
    speaker: Optional[str] = None
    location: Optional[str] = None

class ScheduleOut(BaseModel):
    id: int
    event_id: int
    day_number: int
    start_time: str
    end_time: Optional[str]
    title: str
    description: Optional[str]
    speaker: Optional[str]
    location: Optional[str]
    class Config: from_attributes = True


# ══════════════════ NOTIFICATION ══════════════════
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str]
    icon: Optional[str]
    created_at: datetime
    class Config: from_attributes = True


# ══════════════════ CONTACT ══════════════════
class ContactCreate(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    subject: Optional[str] = None
    message: str = Field(..., min_length=10)

class ContactOut(BaseModel):
    id: int
    name: str
    email: str
    subject: Optional[str]
    message: str
    is_read: bool
    created_at: datetime
    class Config: from_attributes = True


# ══════════════════ ANALYTICS ══════════════════
class OrganizerStats(BaseModel):
    total_events: int
    published_events: int
    draft_events: int
    total_bookings: int
    confirmed_bookings: int
    total_revenue: float
    upcoming_events: int
    avg_fill_rate: float
    total_attendees: int

class AdminStats(BaseModel):
    total_users: int
    total_organizers: int
    total_events: int
    published_events: int
    total_bookings: int
    confirmed_bookings: int
    total_revenue: float
    total_views: int
    new_users_today: int
    new_bookings_today: int


# ══════════════════ NEWSLETTER ══════════════════
class NewsletterSubscribe(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    categories: List[str] = []

# Forward ref
Token.model_rebuild()
