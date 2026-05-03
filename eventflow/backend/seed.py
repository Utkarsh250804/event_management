"""
EventFlow — Database Seeder v2
Run: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.utils.auth import hash_password
from app.utils.helpers import unique_slug, generate_ticket_id, generate_qr_code
from datetime import datetime, timezone, timedelta

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    print("🌱 Seeding EventFlow v2...")

    # ── Users ──────────────────────────────────────────────
    if db.query(models.User).count() == 0:
        users_data = [
            dict(id=1, name="Admin User",     email="admin@eventflow.in",      password="admin123", role=models.UserRole.admin,     is_verified=True),
            dict(id=2, name="Rahul Sharma",   email="organizer@eventflow.in",  password="org123",   role=models.UserRole.organizer,  is_verified=True),
            dict(id=3, name="Priya Rajan",    email="user@eventflow.in",       password="user123",  role=models.UserRole.user,       is_verified=True),
            dict(id=4, name="Arjun Kapoor",   email="organizer2@eventflow.in", password="org456",   role=models.UserRole.organizer,  is_verified=True),
            dict(id=5, name="Sneha Nair",     email="sneha@eventflow.in",      password="user456",  role=models.UserRole.user,       is_verified=False),
        ]
        for u in users_data:
            user = models.User(
                id=u["id"], name=u["name"], email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"], is_active=True, is_verified=u["is_verified"],
                phone="+91 98765 43210", city="Mumbai",
            )
            db.add(user)
        db.commit()
        # Organizer profiles
        db.add(models.OrganizerProfile(user_id=2, organization_name="Percept Live Events", website="https://perceptlive.com", description="India's leading live entertainment company", verified=True, total_events=45))
        db.add(models.OrganizerProfile(user_id=4, organization_name="Tech Events India",   website="https://techevents.in",   description="Premier tech conference organizer",         verified=True, total_events=12))
        db.commit()
        print("  ✅ 5 users + organizer profiles")

    # ── Events ─────────────────────────────────────────────
    if db.query(models.Event).count() == 0:
        now = datetime.now(timezone.utc)
        events_raw = [
            dict(title="Sunburn Festival 2025",       category=models.EventCategory.music,    organizer_id=2,
                 desc="India's biggest electronic music festival returns to Goa! 50+ international DJs across 4 stages over 3 electrifying days.",
                 short="India's biggest EDM festival — 50+ DJs, 4 stages, 3 days of pure music.",
                 venue="Vagator Beach", city="Goa", state="Goa",
                 days=30, seats=500,  booked=412, price=3999, premium=5500, vip=8000, orig=4999,
                 emoji="🎵", badge="SELLING FAST", featured=True,
                 highlights=["50+ DJs","4 Stages","3-Day Event","Camping Available","Silent Disco"],
                 tags=["EDM","Festival","Outdoor","Camping"],
                 faq=[{"q":"Is camping included?","a":"Camping passes available separately at ₹1,200/night."},
                      {"q":"What's the age limit?","a":"18+ only. Valid ID required at entry."}],
                 organizer_name="Percept Live", dress_code="Casual/Festival Wear", cancellation_hours=72),
            dict(title="TechConf India 2025",         category=models.EventCategory.tech,     organizer_id=4,
                 desc="India's premier technology conference. 3,000+ developers, founders and tech leaders for two days of talks, workshops and networking.",
                 short="3000+ techies, 80 speakers, 20 workshops — India's biggest tech conference.",
                 venue="Bombay Exhibition Centre", city="Mumbai", state="Maharashtra",
                 days=15, seats=1200, booked=780, price=1499, premium=2500, vip=4000, orig=None,
                 emoji="💻", badge="NEW", featured=True,
                 highlights=["80+ Speakers","20 Workshops","Startup Expo","Job Fair","Networking Dinner"],
                 tags=["Technology","AI","Networking","Career"],
                 faq=[{"q":"Will sessions be recorded?","a":"Yes, all main-stage talks will be available to attendees post-event."},
                      {"q":"Is there a hackathon?","a":"Yes! 24-hour hackathon on Day 2 with ₹5L prize pool."}],
                 organizer_name="Tech Events India", dress_code="Business Casual", cancellation_hours=48),
            dict(title="Brewmaster's Festival",       category=models.EventCategory.food,     organizer_id=2,
                 desc="Sample 100+ craft beers from 30 independent breweries across India. Live music, food pairings and brewing masterclasses throughout the evening.",
                 short="100+ craft beers, 30 breweries, live music and brewing masterclasses.",
                 venue="Phoenix Palladium", city="Mumbai", state="Maharashtra",
                 days=10, seats=300, booked=290, price=799, premium=None, vip=None, orig=999,
                 emoji="🍺", badge="ALMOST SOLD OUT", featured=False,
                 highlights=["100+ Beers","30 Breweries","Food Pairings","Masterclasses","Live Music"],
                 tags=["Beer","Food","Lifestyle","Craft"],
                 faq=[{"q":"Is food included?","a":"Light snacks included. Full food available at extra cost."}],
                 organizer_name="Percept Live"),
            dict(title="Bangalore Comedy Night",      category=models.EventCategory.arts,     organizer_id=2,
                 desc="An evening of stand-up comedy featuring five of India's top comedians. Expect bold, fresh material and at least one unplanned moment that goes wildly viral.",
                 short="5 top comedians, 2 hours of laughs — an unforgettable evening.",
                 venue="Chowdiah Memorial Hall", city="Bengaluru", state="Karnataka",
                 days=22, seats=450, booked=230, price=599, premium=899, vip=None, orig=None,
                 emoji="😂", badge=None, featured=False,
                 highlights=["5 Comedians","2 Hours","Full Bar","All Ages"],
                 tags=["Comedy","Entertainment","Nightlife"],
                 organizer_name="Comic Circuit"),
            dict(title="Startup Pitch Night",         category=models.EventCategory.business, organizer_id=4,
                 desc="Watch 10 early-stage startups pitch live to a panel of top VCs and angel investors. Network with founders, mentors and investors over cocktails after the pitches.",
                 short="10 startups pitch live to top VCs. Network over cocktails.",
                 venue="WeWork BKC", city="Mumbai", state="Maharashtra",
                 days=18, seats=200, booked=145, price=499, premium=999, vip=None, orig=None,
                 emoji="🚀", badge=None, featured=False,
                 highlights=["10 Startups","VC Judges","Networking","Cocktails","Mentorship"],
                 tags=["Startup","Investing","Entrepreneurship"],
                 organizer_name="Tech Events India"),
            dict(title="Yoga & Wellness Summit",      category=models.EventCategory.health,   organizer_id=2,
                 desc="A full-day outdoor wellness experience featuring sunrise yoga, meditation sessions, ayurvedic consultations and organic farm-to-table breakfast.",
                 short="Sunrise yoga, meditation, ayurveda and organic brunch in Lalbagh Garden.",
                 venue="Lalbagh Botanical Garden", city="Bengaluru", state="Karnataka",
                 days=25, seats=600, booked=200, price=299, premium=499, vip=None, orig=None,
                 emoji="🧘", badge=None, featured=False,
                 highlights=["Sunrise Yoga","Meditation","Ayurveda","Organic Brunch","Sound Bath"],
                 tags=["Wellness","Yoga","Outdoor","Mindfulness"],
                 organizer_name="Percept Live", dress_code="Comfortable Yoga Wear"),
            dict(title="AR Rahman Live Concert",      category=models.EventCategory.music,    organizer_id=2,
                 desc="The Mozart of Madras performs his greatest hits spanning 30 years of cinema and world music. A once-in-a-generation live experience with a 60-piece orchestra.",
                 short="30 years of musical magic — AR Rahman live with a 60-piece orchestra.",
                 venue="DY Patil Stadium", city="Mumbai", state="Maharashtra",
                 days=45, seats=20000, booked=14000, price=2499, premium=4000, vip=8000, orig=None,
                 emoji="🎹", badge="FEATURED", featured=True,
                 highlights=["60-Piece Orchestra","30 Years of Music","Stadium Show","3 Hours","Special Guests"],
                 tags=["Bollywood","Classical","Concert","Live Music"],
                 faq=[{"q":"Is there parking?","a":"Limited parking available. Public transport recommended."},
                      {"q":"Can I bring a camera?","a":"No professional cameras. Phone cameras allowed."}],
                 organizer_name="Percept Live", min_age=5, cancellation_hours=120),
            dict(title="Photography Masterclass",     category=models.EventCategory.arts,     organizer_id=4,
                 desc="An intensive 6-hour masterclass with National Geographic photographer Rahul Mehta. Learn composition, lighting, post-processing and storytelling through images.",
                 short="6-hour masterclass with a National Geographic photographer — certificate included.",
                 venue="Kala Ghoda Studio", city="Mumbai", state="Maharashtra",
                 days=12, seats=25, booked=18, price=1299, premium=None, vip=None, orig=1499,
                 emoji="📷", badge=None, featured=False,
                 highlights=["NatGeo Photographer","6 Hours","Certificate","Equipment Provided","Portfolio Review"],
                 tags=["Photography","Workshop","Creative","Portfolio"],
                 organizer_name="Tech Events India"),
            dict(title="Delhi Food Trail 2025",       category=models.EventCategory.food,     organizer_id=4,
                 desc="A curated 4-hour food tour through the iconic lanes of Old Delhi. Taste 15+ dishes at legendary eateries, guided by food historians and local experts.",
                 short="15+ tastings across Old Delhi's legendary eateries with a food historian guide.",
                 venue="Old Delhi Heritage District", city="Delhi", state="Delhi",
                 days=35, seats=80, booked=45, price=1999, premium=None, vip=None, orig=None,
                 emoji="🍛", badge=None, featured=False,
                 highlights=["15+ Tastings","4-Hour Tour","Food Historian","Gift Hamper","History Walk"],
                 tags=["Food","Heritage","Tour","Delhi"],
                 organizer_name="Tech Events India"),
            dict(title="React & TypeScript Bootcamp", category=models.EventCategory.education, organizer_id=4,
                 desc="Two-day intensive bootcamp covering React 18, TypeScript, state management, testing and deployment. Includes 3-month mentorship access post-bootcamp.",
                 short="2-day React + TypeScript intensive with 3-month mentorship — build real projects.",
                 venue="91springboard Koramangala", city="Bengaluru", state="Karnataka",
                 days=20, seats=40, booked=32, price=4999, premium=None, vip=None, orig=5999,
                 emoji="⚛️", badge="NEW", featured=True,
                 highlights=["React 18","TypeScript","Testing","Deployment","3-Month Mentorship"],
                 tags=["React","TypeScript","Bootcamp","Frontend"],
                 organizer_name="Tech Events India"),
            dict(title="Mumbai Marathon 2025",        category=models.EventCategory.sports,   organizer_id=2,
                 desc="Run through the iconic streets of Mumbai in one of Asia's most prestigious marathons. Choose from Full (42km), Half (21km) or 10K runs.",
                 short="Full, Half or 10K — run through iconic Mumbai streets with 50,000 runners.",
                 venue="Azad Maidan", city="Mumbai", state="Maharashtra",
                 days=55, seats=50000, booked=35000, price=999, premium=1499, vip=None, orig=None,
                 emoji="🏃", badge="FEATURED", featured=True,
                 highlights=["42km / 21km / 10K","Finisher Medal","Timing Chip","Refreshment Stations","T-Shirt"],
                 tags=["Marathon","Running","Sports","Fitness"],
                 organizer_name="Percept Live", dress_code="Sportswear", cancellation_hours=168),
            dict(title="Classical Music Evening",     category=models.EventCategory.music,    organizer_id=2,
                 desc="An intimate evening of Hindustani classical music performed by Pandit Ravi Shankar's disciples. A meditative and soulful experience in a heritage setting.",
                 short="Intimate Hindustani classical evening in a heritage setting.",
                 venue="Nehru Centre", city="Mumbai", state="Maharashtra",
                 days=8, seats=120, booked=95, price=699, premium=999, vip=1499, orig=None,
                 emoji="🎸", badge=None, featured=False,
                 highlights=["Live Classical Music","Heritage Venue","Intimate Setting","Post-Show Meet & Greet"],
                 tags=["Classical","Music","Hindustani","Heritage"],
                 organizer_name="Percept Live"),
        ]

        for e in events_raw:
            slug = unique_slug(db, e["title"], models.Event)
            event = models.Event(
                title=e["title"], slug=slug,
                short_description=e.get("short"),
                description=e["desc"],
                category=e["category"],
                venue_name=e["venue"], city=e["city"], state=e.get("state"),
                event_date=now + timedelta(days=e["days"]),
                end_date=now + timedelta(days=e["days"], hours=4),
                total_seats=e["seats"], booked_seats=e["booked"],
                standard_price=e["price"],
                premium_price=e.get("premium"),
                vip_price=e.get("vip"),
                original_price=e.get("orig"),
                icon_emoji=e["emoji"],
                badge=e.get("badge"),
                is_featured=e.get("featured", False),
                highlights=e.get("highlights", []),
                tags=e.get("tags", []),
                faq=e.get("faq", []),
                organizer_id=e["organizer_id"],
                organizer_name=e.get("organizer_name"),
                status=models.EventStatus.published,
                published_at=now,
                dress_code=e.get("dress_code"),
                cancellation_hours=e.get("cancellation_hours", 24),
                min_age=e.get("min_age"),
                view_count=e["booked"] * 3,
                refund_policy="Cancellations 24+ hours before event: full refund. Within 24 hours: no refund.",
            )
            db.add(event)
        db.commit()
        print(f"  ✅ {len(events_raw)} events created")

    # ── Demo Bookings ──────────────────────────────────────
    if db.query(models.Booking).count() == 0:
        event1 = db.query(models.Event).filter(models.Event.title == "TechConf India 2025").first()
        event2 = db.query(models.Event).filter(models.Event.title == "Bangalore Comedy Night").first()
        user   = db.query(models.User).filter(models.User.email == "user@eventflow.in").first()
        if event1 and user:
            tid = generate_ticket_id(event1.id, user.id)
            b = models.Booking(
                ticket_id=tid, user_id=user.id, event_id=event1.id,
                ticket_type=models.TicketType.standard, quantity=2,
                price_per_ticket=1499, original_price=2998, discount_amount=0, total_amount=2998,
                status=models.BookingStatus.confirmed, qr_code_data=generate_qr_code(tid),
                attendee_name=user.name, attendee_email=user.email, attendee_phone=user.phone,
            )
            db.add(b)
        if event2 and user:
            tid2 = generate_ticket_id(event2.id, user.id)
            b2 = models.Booking(
                ticket_id=tid2, user_id=user.id, event_id=event2.id,
                ticket_type=models.TicketType.premium, quantity=1,
                price_per_ticket=899, original_price=899, discount_amount=0, total_amount=899,
                status=models.BookingStatus.attended, qr_code_data=generate_qr_code(tid2),
                checked_in=True, checked_in_at=now - timedelta(days=2),
                attendee_name=user.name, attendee_email=user.email,
            )
            db.add(b2)
        db.commit()
        print("  ✅ Demo bookings created")

    # ── Demo Review ────────────────────────────────────────
    if db.query(models.Review).count() == 0:
        event2 = db.query(models.Event).filter(models.Event.title == "Bangalore Comedy Night").first()
        user   = db.query(models.User).filter(models.User.email == "user@eventflow.in").first()
        if event2 and user:
            db.add(models.Review(user_id=user.id, event_id=event2.id, rating=5,
                comment="Absolutely hilarious evening! All 5 comedians were on fire. Rohan's set about startup culture had the entire hall in splits. Will definitely attend next time!",
                is_verified=True))
            db.commit()
        print("  ✅ Demo review created")

    # ── Demo Coupon ────────────────────────────────────────
    if db.query(models.Coupon).count() == 0:
        organizer = db.query(models.User).filter(models.User.email == "organizer@eventflow.in").first()
        if organizer:
            db.add(models.Coupon(code="WELCOME20", type=models.CouponType.percentage, value=20,
                max_discount=500, min_order_amount=500, is_active=True, created_by=organizer.id,
                valid_until=now + timedelta(days=90)))
            db.add(models.Coupon(code="FLAT200", type=models.CouponType.flat, value=200,
                min_order_amount=1000, is_active=True, created_by=organizer.id,
                valid_until=now + timedelta(days=60)))
            db.add(models.Coupon(code="TECHCONF", type=models.CouponType.percentage, value=15,
                max_discount=300, is_active=True, created_by=organizer.id,
                valid_until=now + timedelta(days=30), max_uses=50))
            db.commit()
        print("  ✅ Demo coupons: WELCOME20, FLAT200, TECHCONF")

    # ── Notifications ──────────────────────────────────────
    if db.query(models.Notification).count() == 0:
        user = db.query(models.User).filter(models.User.email == "user@eventflow.in").first()
        if user:
            notifs = [
                dict(title="Welcome to EventFlow! 🎉", message="Start exploring thousands of amazing events.", type="success", icon="🎉"),
                dict(title="Booking Confirmed 🎟", message="Your 2 tickets for TechConf India 2025 are confirmed.", type="success", link="/pages/dashboard.html", icon="🎟"),
                dict(title="Event Tomorrow! ⏰", message="Bangalore Comedy Night is tomorrow at 8 PM. Don't forget!", type="info", icon="⏰"),
                dict(title="New Coupon Available", message="Use code WELCOME20 for 20% off your next booking.", type="info", icon="🎁"),
            ]
            for n in notifs:
                db.add(models.Notification(user_id=user.id, **n))
            db.commit()
        print("  ✅ Demo notifications created")

    # ── Newsletter ─────────────────────────────────────────
    if db.query(models.NewsletterSubscriber).count() == 0:
        for email, name in [("priya@example.com","Priya R"),("dev@example.com","Dev S"),("anjali@example.com","Anjali M")]:
            db.add(models.NewsletterSubscriber(email=email, name=name, categories=["Music","Tech"], is_active=True))
        db.commit()
        print("  ✅ Newsletter subscribers seeded")

    print("\n✅ Seeding complete!\n")
    print("Demo accounts:")
    print("  👑 Admin:     admin@eventflow.in       / admin123")
    print("  🎪 Organizer: organizer@eventflow.in   / org123")
    print("  👤 User:      user@eventflow.in        / user123")
    print("\nDemo coupons: WELCOME20 · FLAT200 · TECHCONF")
    db.close()

if __name__ == "__main__":
    seed()
