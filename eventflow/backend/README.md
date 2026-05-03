# EventFlow — FastAPI Backend v2.0

**Online Event Booking & Management System**  
Built with FastAPI · SQLAlchemy · SQLite/PostgreSQL · JWT · QR Code · Email

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Seed database with demo data
python seed.py

# 3. Run the server
uvicorn app.main:app --reload --port 8000
```

**Swagger UI →** http://localhost:8000/api/docs  
**ReDoc →** http://localhost:8000/api/redoc  
**Health →** http://localhost:8000/api/health  

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 👑 Admin | admin@eventflow.in | admin123 | Full platform control |
| 🎪 Organizer | organizer@eventflow.in | org123 | Event & booking management |
| 👤 User | user@eventflow.in | user123 | Browse, book, review |

**Demo Coupon Codes:** `WELCOME20` (20% off) · `FLAT200` (₹200 off) · `TECHCONF` (15% off)

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Settings from .env (pydantic-settings)
│   ├── database.py          # SQLAlchemy engine + session + WAL mode
│   ├── models.py            # 16 database models (all relationships)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py          # Register, Login, JWT refresh, Me
│   │   ├── events.py        # Full CRUD, search, filter, reviews, wishlist
│   │   ├── bookings.py      # Book tickets, cancel, check-in, refund
│   │   ├── users.py         # Profile, avatar, notifications, activity
│   │   ├── organizer.py     # Dashboard, analytics, coupons, revenue
│   │   ├── admin.py         # User/event/booking/refund management
│   │   └── contact.py       # Contact form + newsletter
│   ├── services/
│   │   └── email_service.py # SMTP email (booking confirm, welcome, cancel)
│   └── utils/
│       ├── auth.py          # JWT encode/decode, bcrypt, role guards
│       └── helpers.py       # Slug, ticket ID, QR code, coupon, notify
├── seed.py                  # Demo data: 5 users, 12 events, bookings, coupons
├── requirements.txt
├── .env                     # Environment variables
└── README.md
```

---

## 🗄️ Database Models (16 Tables)

| Table | Description |
|-------|-------------|
| `users` | Auth, roles (user/organizer/admin), profile |
| `organizer_profiles` | Org name, website, social links, bank details |
| `events` | Full event data: pricing, seats, media, FAQ, agenda |
| `event_schedules` | Day-by-day schedule items per event |
| `bookings` | Ticket bookings with QR code + check-in |
| `payments` | Razorpay payment records |
| `refunds` | Refund request + admin approval workflow |
| `coupons` | Percentage/flat discount codes with limits |
| `coupon_usages` | Tracks who used which coupon |
| `wishlist` | User saved events |
| `reviews` | Verified attendee reviews with helpful votes |
| `notifications` | In-app notification centre |
| `event_views` | Analytics: per-event view tracking |
| `user_activities` | Audit log: login, book, cancel, review |
| `contact_messages` | Contact form submissions |
| `newsletter_subscribers` | Email subscription with category preferences |

---

## 🛣️ API Reference (81 Endpoints)

### Authentication — `/api/auth`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new account | — |
| POST | `/login` | Login, returns JWT tokens | — |
| POST | `/login/form` | OAuth2 form login (Swagger UI) | — |
| POST | `/refresh` | Get new access token | — |
| GET | `/me` | Current user info | ✅ |
| POST | `/logout` | Logout (client clears token) | ✅ |

### Events — `/api/events`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List/search events with filters | — |
| POST | `/` | Create event | 🎪 |
| GET | `/featured` | Featured events | — |
| GET | `/trending` | Trending (most viewed) | — |
| GET | `/categories` | Categories with counts | — |
| GET | `/cities` | Cities with event counts | — |
| GET | `/{id}` | Event detail (records view) | — |
| GET | `/slug/{slug}` | Event by slug | — |
| PUT | `/{id}` | Update event | 🎪 |
| DELETE | `/{id}` | Delete event | 🎪 |
| POST | `/{id}/publish` | Publish draft | 🎪 |
| POST | `/{id}/banner` | Upload banner image | 🎪 |
| GET | `/{id}/schedules` | Get event schedule | — |
| POST | `/{id}/schedules` | Add schedule item | 🎪 |
| DELETE | `/{id}/schedules/{sid}` | Remove schedule item | 🎪 |
| GET | `/{id}/reviews` | Get reviews | — |
| POST | `/{id}/reviews` | Add review (must be booked) | ✅ |
| POST | `/{id}/reviews/{rid}/helpful` | Mark review helpful | — |
| POST | `/{id}/wishlist` | Add to wishlist | ✅ |
| DELETE | `/{id}/wishlist` | Remove from wishlist | ✅ |
| GET | `/{id}/wishlist/check` | Check if in wishlist | ✅ |
| POST | `/{id}/coupon/validate` | Validate coupon code | ✅ |

**Query params for GET `/api/events`:**  
`q`, `category`, `city`, `status`, `min_price`, `max_price`, `is_online`, `is_featured`, `date_from`, `date_to`, `sort` (date_asc/date_desc/price_asc/price_desc/popular/newest), `page`, `limit`

### Bookings — `/api/bookings`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Book tickets (with coupon support) | ✅ |
| GET | `/` | My bookings | ✅ |
| GET | `/{ticket_id}` | Booking detail | ✅ |
| POST | `/{ticket_id}/cancel` | Cancel booking | ✅ |
| POST | `/checkin` | QR check-in attendee | 🎪 |
| GET | `/{ticket_id}/ticket` | Full ticket + QR data | ✅ |
| POST | `/refund/request` | Request refund | ✅ |

### Users — `/api/users`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/profile` | Get profile | ✅ |
| PUT | `/profile` | Update profile | ✅ |
| POST | `/avatar` | Upload avatar image | ✅ |
| POST | `/change-password` | Change password | ✅ |
| GET | `/wishlist` | My saved events | ✅ |
| GET | `/notifications` | All notifications | ✅ |
| GET | `/notifications/unread-count` | Unread badge count | ✅ |
| POST | `/notifications/read-all` | Mark all as read | ✅ |
| DELETE | `/notifications/{id}` | Delete notification | ✅ |
| GET | `/activity` | Recent activity log | ✅ |

### Organizer — `/api/organizer`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard` | Stats overview | 🎪 |
| GET | `/events` | My events | 🎪 |
| GET | `/events/{id}/bookings` | Event's bookings | 🎪 |
| GET | `/events/{id}/analytics` | Full event analytics | 🎪 |
| GET | `/revenue` | Monthly revenue chart | 🎪 |
| GET | `/profile` | Organizer profile | 🎪 |
| PUT | `/profile` | Update organizer profile | 🎪 |
| POST | `/coupons` | Create coupon | 🎪 |
| GET | `/coupons` | My coupons | 🎪 |
| DELETE | `/coupons/{id}` | Delete coupon | 🎪 |

### Admin — `/api/admin`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/stats` | Platform-wide stats | 👑 |
| GET | `/users` | All users (search, filter) | 👑 |
| PUT | `/users/{id}/role` | Change user role | 👑 |
| PUT | `/users/{id}/activate` | Activate/deactivate | 👑 |
| DELETE | `/users/{id}` | Delete user | 👑 |
| GET | `/events` | All events (any status) | 👑 |
| PUT | `/events/{id}/feature` | Toggle featured | 👑 |
| PUT | `/events/{id}/status` | Set event status | 👑 |
| GET | `/bookings` | All platform bookings | 👑 |
| GET | `/refunds` | All refund requests | 👑 |
| PUT | `/refunds/{id}` | Approve/reject refund | 👑 |
| GET | `/messages` | Contact messages | 👑 |
| PUT | `/messages/{id}/read` | Mark message read | 👑 |
| GET | `/coupons` | All coupons | 👑 |
| GET | `/activity-log` | Platform activity log | 👑 |
| GET | `/newsletter-subscribers` | All subscribers | 👑 |
| GET | `/revenue-analytics` | Revenue by day/category | 👑 |

### Contact — `/api/contact`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Submit contact message |
| POST | `/newsletter` | Subscribe to newsletter |
| DELETE | `/newsletter/{email}` | Unsubscribe |

---

## 🔐 Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

**Login example:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@eventflow.in","password":"user123"}'
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": 3, "name": "Priya Rajan", "role": "user", ... }
}
```

---

## 🎫 Booking with Coupon

```bash
curl -X POST http://localhost:8000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": 2,
    "ticket_type": "standard",
    "quantity": 2,
    "coupon_code": "WELCOME20"
  }'
```

---

## 📧 Email Configuration

Set in `.env` to enable real email sending:
```env
EMAIL_ENABLED=True
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=your-app-password
```

Emails sent automatically for:
- New user registration (welcome email)
- Booking confirmation (with ticket ID)
- Booking cancellation
- Refund approval/rejection notifications

---

## 🌐 Frontend Integration

```javascript
const API = 'http://localhost:8000/api';

// Login
const res = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { access_token, user } = await res.json();

// Authenticated request
const events = await fetch(`${API}/events?category=Music&page=1`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
```

---

## 🚢 Production Deployment

### Switch to PostgreSQL
```env
DATABASE_URL=postgresql://user:password@localhost:5432/eventflow
```
```bash
pip install psycopg2-binary
```

### Generate secure secret key
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Run with Gunicorn
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p uploads
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## ✅ Features Checklist

- [x] JWT Authentication (access + refresh tokens)
- [x] Role-based Access Control (User / Organizer / Admin)
- [x] Full Event CRUD with slug routing
- [x] Advanced search & filtering (8 query params)
- [x] Ticket booking with seat management
- [x] QR code generation (base64 PNG) per ticket
- [x] Group booking support
- [x] Coupon system (percentage + flat, limits, expiry)
- [x] Ticket check-in via QR scan
- [x] Booking cancellation with time-window enforcement
- [x] Refund request + admin approval workflow
- [x] Event reviews (verified attendees only)
- [x] Wishlist with count tracking
- [x] In-app notification centre
- [x] Organizer dashboard with full analytics
- [x] Revenue reports (monthly + by category)
- [x] Admin panel — manage all users, events, bookings
- [x] Event schedule / agenda management
- [x] Image upload (banner + avatar)
- [x] Email service (booking, welcome, cancel, refund)
- [x] User activity audit log
- [x] Event view tracking (analytics)
- [x] Newsletter subscription
- [x] Contact form
- [x] SQLite (dev) + PostgreSQL-ready (prod)
- [x] WAL mode for SQLite concurrency
- [x] CORS configured
- [x] OpenAPI docs (Swagger + ReDoc)
