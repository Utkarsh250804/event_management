# EventFlow — Bug Fix Report

## Summary
All critical bugs have been fixed. The project is now production-ready.

---

## Bugs Fixed

### 🔴 Bug 1: `bookings.py` — Duplicate & broken `validate_coupon` endpoint
**File:** `backend/app/routers/bookings.py`

**Problem:**
- Two `@router.post("/coupon/validate")` functions existed — FastAPI silently drops the second
- First function referenced `_CVR` (undefined variable) → `NameError` at import time  
- Both accessed `coupon.discount_type` and `coupon.discount_value` — fields that **do not exist** on the `Coupon` model (actual fields: `type`, `value`)

**Fix:** Removed both broken versions. Single clean implementation using correct model attributes (`coupon.type`, `coupon.value`) with consistent response shape (`discount_amount`, `message`, `final_amount`).

---

### 🔴 Bug 2: `organizer.py` — Dashboard returns wrong response shape
**File:** `backend/app/routers/organizer.py`

**Problem:** Dashboard returned a flat `OrganizerStats` Pydantic model. Frontend expected `{ stats: {...}, recent_events: [...] }` → dashboard showed all zeros, no event list.

**Fix:** Changed to return `{ stats: {...}, recent_events: [...] }` with per-event revenue calculated inline.

---

### 🔴 Bug 3: `organizer.py` — Revenue missing expected fields
**File:** `backend/app/routers/organizer.py`

**Problem:** Revenue endpoint only returned `{ monthly_revenue, total }`. Frontend expected `total_revenue`, `this_month`, `avg_per_event` → Revenue page showed ₹0 everywhere.

**Fix:** Added all three fields. `this_month` computed from current month key. `avg_per_event = total / num_events`.

---

### 🔴 Bug 4: `App.jsx` — `require()` everywhere (invalid in Vite/ESM)
**File:** `frontend/src/App.jsx`

**Problem:** ~15 `require()` calls inside React function components (`require('./api')`, `require('react-hot-toast')`, `require('react-router-dom').useNavigate()`, etc.). Vite uses ES modules — `require` is **undefined** → runtime crash on every component render.

**Fix:** Added proper top-level ES `import` statements for all dependencies. Removed every `require()` call.

---

### 🔴 Bug 5: `App.jsx` / `Organizer.jsx` — Wrong coupon field names
**Files:** `frontend/src/App.jsx`, `frontend/src/pages/Organizer.jsx`

**Problem:**
- Frontend sent `{ discount_type, discount_value, min_amount, expires_at }` 
- Backend schema expects `{ type, value, min_order_amount, valid_until }`
- Backend also uses `flat` (not `fixed`) for flat-amount coupon type
- Coupon table displayed `c.discount_type`, `c.discount_value`, `c.expires_at` → all `undefined`

**Fix:** Updated form state, submit payload, and table display columns to use correct backend field names.

---

### 🔴 Bug 6: `events.py` — `create_event` passes `organizer_name` twice
**File:** `backend/app/routers/events.py`

**Problem:** `payload.model_dump(exclude={"status"})` still included `organizer_name`, then it was also passed as an explicit kwarg → `TypeError: unexpected keyword argument 'organizer_name'` → Create Event always 500s.

**Fix:** Added `organizer_name` to the exclude set, passed explicitly as `payload.organizer_name or u.name`.

---

### 🔴 Bug 7: `Organizer.jsx` — `OrganizerProfile` uses `require()`
**File:** `frontend/src/pages/Organizer.jsx`

**Problem:** `const { usersAPI: usAPI } = require('../api')` inside a React component → undefined in Vite ESM.

**Fix:** Added `usersAPI as usAPI` to the top-level import statement.

---

### 🟡 Bug 8: `bookings.py` — Missing `/my` route alias
**File:** `backend/app/routers/bookings.py`

**Problem:** Frontend calls `GET /bookings/my` but backend only had `GET /bookings`. Would 404 or match `/{ticket_id}` with "my" as ticket_id.

**Fix:** Added `@router.get("/my")` alias that delegates to the main `my_bookings` function.

---

### 🟡 Bug 9: `bookings.py` — Cancel route expects string but frontend sends integer
**File:** `backend/app/routers/bookings.py`

**Problem:** `POST /bookings/{ticket_id}/cancel` expected the EF-XXXX string ticket ID, but the Dashboard cancel button passes `booking.id` (integer).

**Fix:** Made cancel route detect numeric IDs and look up by `Booking.id`, falling back to string `ticket_id` lookup.

---

### 🟡 Bug 10: `bookings.py` — Missing `/{booking_id}/refund` route
**File:** `backend/app/routers/bookings.py`

**Problem:** Frontend calls `POST /bookings/{id}/refund` but backend only had `POST /bookings/refund/request` (different URL structure).

**Fix:** Added `/{booking_id}/refund` route alias that delegates to `request_refund`.

---

## How to Run

### Backend
```bash
cd eventflow_fixed/backend
pip install -r requirements.txt
python seed.py          # seed demo data (admin, organizer, user accounts)
uvicorn app.main:app --reload --port 8000
```

API Docs: http://localhost:8000/api/docs

### Frontend
```bash
cd eventflow_fixed/eventflow-frontend
npm install
npm run dev             # http://localhost:5173
```

The Vite proxy in `vite.config.js` forwards all `/api` requests to `http://localhost:8000`.

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@eventflow.in | admin123 |
| 🎪 Organizer | organizer@eventflow.in | org123 |
| 👤 User | user@eventflow.in | user123 |

---

## Testing Each Feature

### Create Event
1. Log in as organizer (organizer@eventflow.in / org123)
2. Go to Organizer → Create Event
3. Fill Title, Category, Date, Venue, Seats, Standard Price
4. Click **Create Event** → redirects to My Events

### Revenue Page
1. Log in as organizer
2. Go to Organizer → Revenue
3. Should display Total Revenue, This Month, and Avg per Event cards
4. Below shows monthly breakdown table

### Coupons
1. Log in as organizer
2. Go to Organizer → Coupons
3. Click **+ New Coupon**
4. Fill: Code=`SAVE20`, Type=`Percentage (%)`, Value=`20`, then Create
5. Coupon appears in the table with correct type/value

### Coupon Validation (on booking)
1. Browse to any published event
2. Click Book
3. Enter coupon code `SAVE20`
4. Discount applied automatically

### Booking Cancellation
1. Log in as user, make a booking
2. Go to Dashboard → My Bookings
3. Click Cancel → confirms and updates status

### Admin Panel
1. Log in as admin@eventflow.in
2. Access /admin for full platform overview
