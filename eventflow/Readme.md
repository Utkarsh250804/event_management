# 🎪 EventFlow — Online Event Booking & Management System

EventFlow ek full-stack web application hai jisme users events browse aur book kar sakte hain, organizers apne events manage kar sakte hain, aur admins poore platform ko control kar sakte hain.

---

## 📁 Project Structure

```
eventflow_bugfixed/
├── backend/                        # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── models.py               # SQLAlchemy database models
│   │   ├── schemas.py              # Pydantic request/response schemas
│   │   ├── database.py             # DB connection setup
│   │   ├── config.py               # Environment config
│   │   ├── routers/
│   │   │   ├── auth.py             # Login, Register, Token refresh
│   │   │   ├── events.py           # Event CRUD, search, reviews, wishlist
│   │   │   ├── bookings.py         # Book tickets, cancel, refund, QR
│   │   │   ├── organizer.py        # Organizer dashboard, coupons, analytics
│   │   │   ├── admin.py            # Admin panel — users, events, refunds
│   │   │   ├── users.py            # Profile, password, notifications
│   │   │   └── contact.py          # Contact form, newsletter
│   │   ├── utils/
│   │   │   ├── auth.py             # JWT token helpers, role guards
│   │   │   └── helpers.py          # Slug, QR code, coupon logic
│   │   └── services/
│   │       └── email_service.py    # Email notifications (SMTP)
│   ├── seed.py                     # Demo data seeder
│   ├── requirements.txt
│   └── .env                        # Environment variables
│
└── eventflow-frontend/             # React + Vite Frontend
    ├── src/
    │   ├── App.jsx                 # Routes + Admin/Coupon pages
    │   ├── main.jsx
    │   ├── api/
    │   │   └── index.js            # All API calls (axios)
    │   ├── store/
    │   │   └── authStore.js        # Zustand auth state
    │   ├── pages/
    │   │   ├── Home.jsx            # Landing page
    │   │   ├── Events.jsx          # Browse & filter events
    │   │   ├── EventDetail.jsx     # Event detail + booking
    │   │   ├── Auth.jsx            # Login / Register
    │   │   ├── Dashboard.jsx       # User dashboard (bookings, profile)
    │   │   ├── Organizer.jsx       # Organizer panel (events, coupons)
    │   │   ├── Admin.jsx           # Admin panel
    │   │   └── Contact.jsx         # Contact page
    │   └── components/
    │       ├── ui/index.jsx        # Shared UI components
    │       ├── layout/             # Navbar, Footer
    │       └── events/EventCard.jsx
    └── vite.config.js              # Vite + API proxy config
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Zustand, Axios |
| Backend | FastAPI, Python 3.11+ |
| Database | SQLite (dev) — PostgreSQL ready |
| Auth | JWT (access + refresh tokens) |
| ORM | SQLAlchemy 2.0 |
| Validation | Pydantic v2 |
| Email | SMTP (Gmail compatible) |
| Payment | Razorpay (integration ready) |

---

## 🚀 Setup & Run Karna

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

---

### Step 1 — Backend Setup

```bash
cd eventflow_bugfixed/backend
```

**Virtual environment banao (recommended):**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

**Dependencies install karo:**
```bash
pip install -r requirements.txt
```

**Environment file check karo** (`.env` already included hai):
```env
DATABASE_URL=sqlite:///./eventflow.db
SECRET_KEY=eventflow-change-in-production-2025-xyz
ACCESS_TOKEN_EXPIRE_MINUTES=1440
EMAIL_ENABLED=False
PAYMENT_ENABLED=False
```

**Demo data seed karo:**
```bash
python seed.py
```

**Server start karo:**
```bash
uvicorn app.main:app --reload --port 8000
```

✅ Backend: `http://localhost:8000`
✅ API Docs: `http://localhost:8000/api/docs`

---

### Step 2 — Frontend Setup

```bash
cd eventflow_bugfixed/eventflow-frontend
```

**Dependencies install karo:**
```bash
npm install
```

**Dev server start karo:**
```bash
npm run dev
```

✅ Frontend: `http://localhost:5173`

> **Note:** Vite automatically `/api` requests ko `http://localhost:8000` pe forward karta hai — koi extra config nahi chahiye.

---

## 👤 Demo Accounts

| Role | Email | Password |
|---|---|---|
| 👑 Admin | admin@eventflow.in | admin123 |
| 🎪 Organizer | organizer@eventflow.in | org123 |
| 👤 User | user@eventflow.in | user123 |

---

## 🌟 Features

### 👤 User
- Register / Login (JWT auth)
- Events browse karo — search, filter by category, city, price, date
- Event detail page — description, schedule, reviews, location
- Ticket book karo (Standard / Premium / VIP)
- Coupon code apply karo booking pe
- My Bookings — status dekho, cancel karo
- Wishlist — events save karo baad ke liye
- Reviews likho (sirf confirmed attendees)
- Notifications center
- Profile & password update

### 🎪 Organizer
- Event create, edit, delete, publish
- My Events list with booking progress
- Coupon create karo (percentage ya flat discount)
- Revenue dashboard — monthly breakdown
- Per-event analytics — views, bookings, fill rate
- Organizer profile (organization name, social links, PAN/GST)

### 👑 Admin
- Full platform dashboard
- Sabhi users manage karo (role change, activate/deactivate)
- Sabhi events moderate karo (feature, status change)
- Sabhi bookings dekho
- Refund requests approve/reject karo
- Contact form submissions
- Newsletter subscribers

---

## 🗂️ API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | New user register |
| POST | `/login` | Login → JWT token |
| GET | `/me` | Current user info |
| POST | `/logout` | Logout |

### Events — `/api/events`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Events list (search, filter, paginate) |
| GET | `/featured` | Featured events |
| GET | `/trending` | Trending events |
| GET | `/{id}` | Event detail |
| POST | `/` | Event create (organizer) |
| PUT | `/{id}` | Event update (organizer) |
| DELETE | `/{id}` | Event delete (organizer) |
| POST | `/{id}/publish` | Publish event |
| POST | `/{id}/reviews` | Review add karo |
| POST | `/{id}/wishlist` | Wishlist mein add karo |

### Bookings — `/api/bookings`
| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Ticket book karo |
| GET | `/my` | Meri sabhi bookings |
| POST | `/{id}/cancel` | Booking cancel karo |
| POST | `/{id}/refund` | Refund request |
| GET | `/{id}/ticket` | Ticket + QR code |
| POST | `/coupon/validate` | Coupon validate karo |

### Organizer — `/api/organizer`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Stats + recent events |
| GET | `/events` | Mere events |
| GET | `/revenue` | Revenue breakdown |
| POST | `/coupons` | Coupon banao |
| GET | `/coupons` | Mere coupons |
| DELETE | `/coupons/{id}` | Coupon delete karo |

### Admin — `/api/admin`
| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard` | Platform stats |
| GET | `/users` | Sabhi users |
| PUT | `/users/{id}/role` | Role change karo |
| GET | `/events` | Sabhi events |
| PUT | `/events/{id}` | Event moderate karo |
| GET | `/refunds` | Refund requests |
| POST | `/refunds/{id}/process` | Refund process karo |

---

## 🔧 Environment Variables

`.env` file `backend/` folder mein hai:

```env
# App
APP_NAME=EventFlow
APP_ENV=development
DEBUG=True
FRONTEND_URL=http://localhost:5500

# Database
DATABASE_URL=sqlite:///./eventflow.db
# Production ke liye:
# DATABASE_URL=postgresql://user:password@localhost/eventflow

# JWT Auth
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Email (optional)
EMAIL_ENABLED=False
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@eventflow.in

# File Upload
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=10

# Razorpay Payment (optional)
PAYMENT_ENABLED=False
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

---

## 📧 Email Setup (Optional)

Gmail se email bhejne ke liye:

1. Gmail mein **2-Factor Authentication** enable karo
2. **App Password** generate karo: Google Account → Security → App Passwords
3. `.env` mein update karo:
```env
EMAIL_ENABLED=True
SMTP_USERNAME=tumhara@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx   # App password
```

---

## 💳 Razorpay Payment Setup (Optional)

1. [razorpay.com](https://razorpay.com) pe account banao
2. Test API keys lo Dashboard se
3. `.env` mein update karo:
```env
PAYMENT_ENABLED=True
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
```

---

## 🏗️ Production Deployment

### Backend (PostgreSQL use karo)
```env
DATABASE_URL=postgresql://user:password@localhost/eventflow
SECRET_KEY=strong-random-secret-key-minimum-32-chars
DEBUG=False
APP_ENV=production
```

### Frontend Build
```bash
cd eventflow-frontend
npm run build
# dist/ folder serve karo Nginx/Apache se
```

### CORS Update
`backend/app/main.py` mein:
```python
allow_origins=["https://yourdomain.com"]  # * ki jagah
```

---

## 🐛 Bug Fixes (Is Version Mein)

Is `bugfixed` version mein ye issues fix kiye gaye hain:

1. **Event Create fail hona** — `parseFloat(undefined)` se `NaN` ban raha tha jo Pydantic reject karta tha. Safe `toFloat()`, `toDate()`, `toStr()` helpers se fix kiya.

2. **Coupon Create fail hona** — `organizer.py` mein `code` field duplicate pass ho rahi thi (`TypeError`). `exclude={"code"}` se fix kiya.

3. **My Bookings/Overview page khaali rehna** — API `{ total, bookings: [] }` return karta tha lekin frontend `r.data` (poora object) array ki jagah set kar raha tha. `r.data?.bookings` se fix kiya.

4. **Organizer Dashboard zeros dikhana** — Wrong response shape. `{ stats, recent_events }` structure se fix kiya.

5. **Revenue page ₹0 dikhana** — `total_revenue`, `this_month`, `avg_per_event` fields missing thi.

6. **Booking Cancel kaam na karna** — Cancel route string ticket ID expect karta tha, frontend integer `id` bhej raha tha. Numeric detection se fix kiya.

---

## 📞 Support

Koi issue ho toh:
- API docs check karo: `http://localhost:8000/api/docs`
- Browser Console mein error dekho (F12)
- Backend terminal mein error logs dekho