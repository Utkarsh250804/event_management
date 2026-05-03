import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { eventsAPI, bookingsAPI } from '../api'
import { useAuthStore } from '../store/authStore'
import { Btn, Badge, Spinner, Stars, Modal, Empty } from '../components/ui'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './EventDetail.css'

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuth } = useAuthStore()

  const [event, setEvent]         = useState(null)
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [bookModal, setBookModal] = useState(false)
  const [booking, setBooking]     = useState({ ticketType:'standard', quantity:1, couponCode:'' })
  const [bookLoading, setBookLoading] = useState(false)
  const [couponInfo, setCouponInfo]   = useState(null)
  const [successModal, setSuccessModal] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [review, setReview] = useState({ rating:5, comment:'' })
  const [activeTab, setActiveTab] = useState('about')

  useEffect(() => {
    const load = async () => {
      try {
        const [ev, rv] = await Promise.all([eventsAPI.byId(id), eventsAPI.reviews(id)])
        setEvent(ev.data)
        setReviews(rv.data)
        eventsAPI.trackView(id)
      } catch { navigate('/events') }
      setLoading(false)
    }
    load()
  }, [id])

  const prices = event ? {
    standard: event.standard_price,
    premium:  event.premium_price || event.standard_price * 1.4,
    vip:      event.vip_price     || event.standard_price * 2,
  } : {}

  const unitPrice  = prices[booking.ticketType] || 0
  const subtotal   = unitPrice * booking.quantity
  const discount   = couponInfo?.discount || 0
  const total      = Math.max(0, subtotal - discount)

  const handleBook = async () => {
    if (!isAuth()) { navigate('/login?redirect=/events/' + id); return }
    setBookLoading(true)
    try {
      const { data } = await bookingsAPI.create({
        event_id:     parseInt(id),
        ticket_type:  booking.ticketType,
        quantity:     booking.quantity,
        coupon_code:  booking.couponCode || undefined,
        attendee_name:  user.name,
        attendee_email: user.email,
        attendee_phone: user.phone,
      })
      setCreatedBooking(data)
      setBookModal(false)
      setSuccessModal(true)
      setEvent(ev => ev ? { ...ev, booked_seats: ev.booked_seats + booking.quantity } : ev)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking failed. Try again.')
    } finally { setBookLoading(false) }
  }

  const handleReview = async () => {
    try {
      await eventsAPI.addReview(id, review)
      toast.success('Review submitted!')
      setReviewModal(false)
      const rv = await eventsAPI.reviews(id)
      setReviews(rv.data)
    } catch (err) { toast.error(err.response?.data?.detail || 'Could not submit review') }
  }

  const toggleWishlist = async () => {
    if (!isAuth()) { navigate('/login'); return }
    try { await eventsAPI.wishlist(id); toast.success('Wishlist updated!') }
    catch { toast.error('Could not update wishlist') }
  }

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}><Spinner size={40} /></div>
  if (!event) return null

  const avail = event.total_seats - event.booked_seats
  const pct   = Math.round((event.booked_seats / event.total_seats) * 100)
  const dateStr = format(new Date(event.event_date), 'EEEE, dd MMMM yyyy')
  const timeStr = format(new Date(event.event_date), 'hh:mm a')

  return (
    <div className="event-detail">
      {/* Hero */}
      <div className="ed-hero" style={{ background:`linear-gradient(rgba(11,22,34,0.82),rgba(11,22,34,0.95))` }}>
        <div className="container">
          <div className="ed-hero-inner">
            <span className="ed-emoji">{event.icon_emoji}</span>
            <div>
              <div className="ed-hero-tags">
                <Badge color="amber">{event.category}</Badge>
                {event.badge && <Badge color="gold">{event.badge}</Badge>}
                {event.is_featured && <Badge color="navy">✦ Featured</Badge>}
              </div>
              <h1 className="ed-title">{event.title}</h1>
              <div className="ed-hero-meta">
                <span>📅 {dateStr} · {timeStr}</span>
                <span>📍 {event.venue_name}, {event.city}</span>
                <span>👤 {event.organizer_name}</span>
                {event.avg_rating && <span>⭐ {event.avg_rating} ({event.review_count} reviews)</span>}
              </div>
              <div className="ed-progress-wrap">
                <div className="ed-progress-bar-track">
                  <div className="ed-progress-fill" style={{ width:`${Math.min(pct,100)}%`, background: pct>=90?'#EF4444':pct>=70?'#F59E0B':'#22C55E' }} />
                </div>
                <span className="ed-progress-label">{pct}% booked · {avail > 0 ? `${avail} seats left` : 'Sold Out'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <div className="container">
          <Link to="/">Home</Link> / <Link to="/events">Events</Link> / <span>{event.title}</span>
        </div>
      </div>

      {/* Layout */}
      <div className="container">
        <div className="ed-layout">
          {/* Main */}
          <div className="ed-main">
            {/* Tabs */}
            <div className="ed-tabs">
              {['about','highlights','faq','reviews'].map(t => (
                <button key={t} className={`ed-tab ${activeTab===t?'active':''}`} onClick={()=>setActiveTab(t)}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                  {t==='reviews' && reviews.length > 0 && <span className="ed-tab-count">{reviews.length}</span>}
                </button>
              ))}
            </div>

            {activeTab === 'about' && (
              <div className="ed-card">
                <h2>About this Event</h2>
                <p className="ed-desc">{event.description}</p>
                {event.dress_code && <div className="ed-detail-row"><span>👔 Dress Code:</span> {event.dress_code}</div>}
                {event.min_age    && <div className="ed-detail-row"><span>🔞 Age Limit:</span>  {event.min_age}+</div>}
                {event.doors_open && <div className="ed-detail-row"><span>🚪 Doors Open:</span> {event.doors_open}</div>}
                {event.parking_info && <div className="ed-detail-row"><span>🅿️ Parking:</span>  {event.parking_info}</div>}
                {event.is_online && (
                  <div className="ed-detail-row online-badge">
                    <span>💻 Online Event</span> · Platform: {event.online_platform || 'To be shared'}
                  </div>
                )}
                <div className="ed-venue-card">
                  <h4>📍 Venue</h4>
                  <p style={{ fontWeight:600, color:'var(--navy)' }}>{event.venue_name}</p>
                  {event.venue_address && <p style={{ fontSize:'0.88rem', color:'var(--text-2)', marginTop:4 }}>{event.venue_address}</p>}
                  <p style={{ fontSize:'0.85rem', color:'var(--text-3)', marginTop:2 }}>{event.city}{event.state ? `, ${event.state}` : ''}</p>
                </div>
                {event.tags?.length > 0 && (
                  <div className="ed-tags-wrap">
                    {event.tags.map(t => <span key={t} className="etag">{t}</span>)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'highlights' && (
              <div className="ed-card">
                <h2>Event Highlights</h2>
                <div className="highlights-grid">
                  {(event.highlights||[]).map(h => (
                    <div key={h} className="highlight-item"><span>✦</span>{h}</div>
                  ))}
                </div>
                {event.agenda?.length > 0 && (
                  <>
                    <h3 style={{ marginTop:28, marginBottom:16 }}>Agenda</h3>
                    <div className="agenda-list">
                      {event.agenda.map((a,i) => (
                        <div key={i} className="agenda-item">
                          {a.time && <span className="agenda-time">{a.time}</span>}
                          <div>
                            <div style={{ fontWeight:600 }}>{a.title}</div>
                            {a.speaker && <div style={{ fontSize:'0.82rem', color:'var(--text-3)' }}>by {a.speaker}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="ed-card">
                <h2>Frequently Asked Questions</h2>
                {event.faq?.length > 0
                  ? event.faq.map((f,i) => (
                    <div key={i} className="faq-item">
                      <div className="faq-q">Q. {f.q}</div>
                      <div className="faq-a">{f.a}</div>
                    </div>
                  ))
                  : <Empty icon="❓" title="No FAQs yet" />
                }
                {event.refund_policy && (
                  <div className="refund-policy">
                    <h4>Refund Policy</h4>
                    <p>{event.refund_policy}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="ed-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
                  <h2>Reviews {event.avg_rating && <span style={{ fontSize:'1rem', fontFamily:'var(--font-body)', color:'var(--text-2)' }}>· ⭐ {event.avg_rating}</span>}</h2>
                  {isAuth() && <Btn variant="outline" size="sm" onClick={()=>setReviewModal(true)}>Write Review</Btn>}
                </div>
                {reviews.length === 0
                  ? <Empty icon="💬" title="No reviews yet" desc="Be the first to review this event!" />
                  : reviews.map(r => (
                    <div key={r.id} className="review-item">
                      <div className="review-head">
                        <div className="review-avatar">{r.user?.name?.[0]}</div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{r.user?.name}</div>
                          <Stars rating={r.rating} />
                        </div>
                        {r.is_verified && <Badge color="green" className="ml-auto">Verified Attendee</Badge>}
                      </div>
                      <p className="review-text">{r.comment}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="ed-sidebar">
            <div className="booking-box">
              <div className="bb-price">
                ₹{event.standard_price?.toLocaleString('en-IN')}
                {event.original_price && event.original_price > event.standard_price && (
                  <span className="bb-orig">₹{event.original_price.toLocaleString('en-IN')}</span>
                )}
                <span className="bb-per"> onwards</span>
              </div>
              <div className={`bb-avail ${avail < 20 ? 'low' : ''}`}>
                {avail > 0 ? `${avail} seats remaining` : 'Sold Out'}
              </div>

              {avail > 0 ? (
                <Btn variant="primary" size="lg" className="btn-full" style={{ marginTop:16 }} onClick={() => setBookModal(true)}>
                  🎟 Book Tickets
                </Btn>
              ) : (
                <Btn variant="outline" size="lg" className="btn-full" style={{ marginTop:16 }} disabled>
                  Sold Out
                </Btn>
              )}

              <button className="wishlist-btn" onClick={toggleWishlist}>❤️ Save to Wishlist</button>

              <div className="bb-info">
                <div className="bb-info-row"><span>📅 Date</span><span>{dateStr}</span></div>
                <div className="bb-info-row"><span>⏰ Time</span><span>{timeStr}</span></div>
                <div className="bb-info-row"><span>📍 Venue</span><span>{event.venue_name}</span></div>
                <div className="bb-info-row"><span>👁 Views</span><span>{event.view_count?.toLocaleString('en-IN')}</span></div>
              </div>

              <div className="bb-share">
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}>🔗 Copy Link</button>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(event.title+' '+window.location.href)}`)}>💬 WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal open={bookModal} onClose={() => setBookModal(false)} title="Book Tickets" width={480}>
        <div className="booking-modal">
          <div className="bm-event">{event.icon_emoji} {event.title}</div>

          <div className="bm-field">
            <label>Ticket Type</label>
            <div className="ticket-types">
              {[
                { key:'standard', label:'Standard', price: event.standard_price },
                ...(event.premium_price ? [{ key:'premium', label:'Premium', price: event.premium_price }] : []),
                ...(event.vip_price ? [{ key:'vip', label:'VIP', price: event.vip_price }] : []),
              ].map(t => (
                <label key={t.key} className={`ticket-type-opt ${booking.ticketType===t.key?'active':''}`}>
                  <input type="radio" name="tt" value={t.key} checked={booking.ticketType===t.key} onChange={() => setBooking(b=>({...b,ticketType:t.key}))} style={{display:'none'}} />
                  <span className="tt-label">{t.label}</span>
                  <span className="tt-price">₹{t.price?.toLocaleString('en-IN')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bm-field">
            <label>Quantity</label>
            <div className="qty-ctrl">
              <button onClick={() => setBooking(b=>({...b,quantity:Math.max(1,b.quantity-1)}))} disabled={booking.quantity<=1}>−</button>
              <span>{booking.quantity}</span>
              <button onClick={() => setBooking(b=>({...b,quantity:Math.min(10,b.quantity+1)}))} disabled={booking.quantity>=Math.min(10,avail)}>+</button>
            </div>
          </div>

          <div className="bm-field">
            <label>Coupon Code (optional)</label>
            <div style={{ display:'flex', gap:8 }}>
              <input className="filter-input" placeholder="e.g. WELCOME20" value={booking.couponCode} onChange={e=>setBooking(b=>({...b,couponCode:e.target.value.toUpperCase()}))} style={{ flex:1 }} />
              <Btn variant="outline" size="sm" onClick={async ()=>{
                if (!booking.couponCode) return
                try {
                  const r = await fetch(`/api/bookings/coupon/validate`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('ef_token')}`}, body:JSON.stringify({code:booking.couponCode,event_id:parseInt(id),amount:subtotal}) })
                  const d = await r.json()
                  if (d.discount) { setCouponInfo(d); toast.success(`Coupon applied! Save ₹${d.discount}`) }
                  else toast.error(d.detail || 'Invalid coupon')
                } catch { toast.error('Could not validate coupon') }
              }}>Apply</Btn>
            </div>
          </div>

          <div className="bm-summary">
            <div className="bms-row"><span>Subtotal ({booking.quantity} × ₹{unitPrice?.toLocaleString('en-IN')})</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            {discount > 0 && <div className="bms-row discount"><span>Discount ({booking.couponCode})</span><span>−₹{discount.toLocaleString('en-IN')}</span></div>}
            <div className="bms-row total"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>

          <Btn variant="primary" size="lg" className="btn-full" loading={bookLoading} onClick={handleBook}>
            Confirm Booking
          </Btn>
          <p className="bm-note">Instant confirmation · Secure payment · QR ticket on confirmation</p>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal open={successModal} onClose={() => setSuccessModal(false)} title="">
        <div style={{ textAlign:'center', padding:'12px 0 8px' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:14 }}>🎉</div>
          <h3 style={{ fontSize:'1.6rem', marginBottom:10, color:'var(--navy)' }}>Booking Confirmed!</h3>
          <p style={{ color:'var(--text-2)', marginBottom:20 }}>Your tickets have been booked successfully.</p>
          {createdBooking && (
            <div style={{ background:'var(--cream)', borderRadius:'var(--r-sm)', padding:14, fontFamily:'monospace', fontWeight:700, color:'var(--navy)', fontSize:'1rem', letterSpacing:1, marginBottom:22 }}>
              {createdBooking.ticket_id}
            </div>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
            <Btn variant="primary" onClick={() => navigate('/dashboard/bookings')}>View My Tickets</Btn>
            <Btn variant="outline" onClick={() => setSuccessModal(false)}>Stay Here</Btn>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Write a Review">
        <div className="review-form">
          <label>Rating</label>
          <div className="rating-stars">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setReview(r=>({...r,rating:n}))} style={{ fontSize:'1.8rem', color: n<=review.rating ? '#E9A84C' : '#DDD', background:'none', border:'none', cursor:'pointer', transition:'color 0.15s' }}>★</button>
            ))}
          </div>
          <label style={{ marginTop:14, display:'block', fontSize:'0.82rem', fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>Your Review</label>
          <textarea className="filter-input" style={{ resize:'vertical', minHeight:100, borderRadius:'var(--r-md)', padding:'10px 12px' }} placeholder="Share your experience..." value={review.comment} onChange={e=>setReview(r=>({...r,comment:e.target.value}))} />
          <Btn variant="primary" size="lg" className="btn-full" style={{ marginTop:16 }} onClick={handleReview}>Submit Review</Btn>
        </div>
      </Modal>
    </div>
  )
}
