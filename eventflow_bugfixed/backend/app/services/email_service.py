"""Email service — uses SMTP. Set EMAIL_ENABLED=True in .env to activate."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_email(to: str, subject: str, html_body: str) -> bool:
    if not settings.EMAIL_ENABLED or not settings.SMTP_USERNAME:
        print(f"[EMAIL MOCK] To: {to} | Subject: {subject}")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, to, msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False

def send_booking_confirmation(to: str, name: str, event_title: str, ticket_id: str, event_date: str, venue: str, total: float):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden">
      <div style="background:#0A0A0F;padding:32px;text-align:center">
        <h1 style="color:#E8B86D;margin:0;font-size:28px">EventFlow</h1>
        <p style="color:rgba(255,255,255,0.6);margin:8px 0 0">Booking Confirmed 🎉</p>
      </div>
      <div style="padding:40px">
        <p style="font-size:16px;color:#333">Hi <strong>{name}</strong>,</p>
        <p style="color:#555;line-height:1.7">Your tickets for <strong>{event_title}</strong> have been confirmed!</p>
        <div style="background:#FAF7F2;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #E8B86D">
          <p style="margin:0 0 8px"><strong>🎟 Ticket ID:</strong> <code style="background:#eee;padding:4px 8px;border-radius:4px">{ticket_id}</code></p>
          <p style="margin:0 0 8px"><strong>📅 Date:</strong> {event_date}</p>
          <p style="margin:0 0 8px"><strong>📍 Venue:</strong> {venue}</p>
          <p style="margin:0"><strong>💰 Total Paid:</strong> ₹{total:,.2f}</p>
        </div>
        <p style="color:#555">Show your QR code at the venue entrance. See you there!</p>
        <div style="text-align:center;margin-top:32px">
          <a href="{settings.FRONTEND_URL}/pages/dashboard.html" style="background:#E8B86D;color:#0A0A0F;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.05em">VIEW MY TICKET</a>
        </div>
      </div>
      <div style="background:#f5f5f5;padding:20px;text-align:center;font-size:12px;color:#999">
        © 2025 EventFlow · <a href="{settings.FRONTEND_URL}" style="color:#999">Visit Website</a>
      </div>
    </div>
    """
    return send_email(to, f"Booking Confirmed: {event_title}", html)

def send_cancellation_email(to: str, name: str, event_title: str, ticket_id: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px">
      <h2>Booking Cancelled</h2>
      <p>Hi {name}, your booking <strong>{ticket_id}</strong> for <strong>{event_title}</strong> has been cancelled.</p>
      <p>If you requested a refund, it will be processed within 5-7 business days.</p>
    </div>
    """
    return send_email(to, f"Booking Cancelled: {event_title}", html)

def send_welcome_email(to: str, name: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0A0A0F;color:#fff;border-radius:12px;overflow:hidden">
      <div style="padding:48px;text-align:center">
        <h1 style="color:#E8B86D">Welcome to EventFlow!</h1>
        <p style="color:rgba(255,255,255,0.65);line-height:1.75">Hi {name}, discover thousands of events and book tickets in seconds.</p>
        <a href="{settings.FRONTEND_URL}" style="display:inline-block;margin-top:28px;background:#E8B86D;color:#0A0A0F;padding:14px 36px;border-radius:100px;text-decoration:none;font-weight:700">EXPLORE EVENTS</a>
      </div>
    </div>
    """
    return send_email(to, "Welcome to EventFlow!", html)
