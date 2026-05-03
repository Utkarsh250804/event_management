import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsAPI, contactAPI } from '../api'
import EventCard from '../components/events/EventCard'
import { Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import './Home.css'

const CATEGORIES = [
  { name:'Music',             emoji:'🎵', color:'#FFF4E0', hover:'#E9A84C' },
  { name:'Tech',              emoji:'💻', color:'#E8F0FF', hover:'#3B82F6' },
  { name:'Sports',            emoji:'⚽', color:'#E8FFE8', hover:'#22C55E' },
  { name:'Food & Drink',      emoji:'🍜', color:'#FFF0F0', hover:'#EF4444' },
  { name:'Arts',              emoji:'🎨', color:'#F4E8FF', hover:'#9333EA' },
  { name:'Business',          emoji:'💼', color:'#F0F4F8', hover:'#1E3A5F' },
  { name:'Education',         emoji:'📚', color:'#E0F8FF', hover:'#0891B2' },
  { name:'Health & Wellness', emoji:'🧘', color:'#E8FFF4', hover:'#059669' },
]

export default function Home() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [newsletter, setNewsletter] = useState('')
  const [nlLoading, setNlLoading] = useState(false)

  useEffect(() => {
    Promise.all([eventsAPI.featured(), eventsAPI.trending()])
      .then(([f, t]) => { setFeatured(f.data); setTrending(t.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/events?q=${encodeURIComponent(searchQ)}`)
  }

  const handleNewsletter = async (e) => {
    e.preventDefault()
    if (!newsletter) return
    setNlLoading(true)
    try {
      await contactAPI.subscribe({ email: newsletter })
      toast.success('Subscribed! 🎉')
      setNewsletter('')
    } catch {
      toast.error('Could not subscribe, try again.')
    } finally { setNlLoading(false) }
  }

  return (
    <div className="home-page">
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
          <div className="grid-pattern" />
        </div>
        <div className="container">
          <div className="hero-inner">
            <div className="hero-content">
              <div className="hero-tag">✦ 12,000+ Events &amp; Counting</div>
              <h1>Discover <em>Moments</em><br />Worth Attending</h1>
              <p className="hero-sub">Browse concerts, workshops, conferences &amp; more. Book tickets instantly — everything in one place.</p>

              <form className="hero-search" onSubmit={handleSearch}>
                <div className="hs-input-wrap">
                  <span className="hs-icon">🔍</span>
                  <input type="text" placeholder="Search events, artists, venues..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-md">Find Events</button>
              </form>

              <div className="hero-stats">
                <div className="hstat"><strong>50K+</strong><span>Attendees</span></div>
                <div className="hstat-div" />
                <div className="hstat"><strong>1,200+</strong><span>Organizers</span></div>
                <div className="hstat-div" />
                <div className="hstat"><strong>98%</strong><span>Satisfaction</span></div>
              </div>
            </div>

            <div className="hero-ticket">
              <div className="ticket floating">
                <div className="ticket-header">
                  <div>
                    <div className="ticket-event">AR Rahman Live</div>
                    <div className="ticket-venue">DY Patil Stadium, Mumbai</div>
                  </div>
                  <span className="badge badge-gold">VIP</span>
                </div>
                <div className="ticket-info">
                  <div><span>📅</span> Dec 27, 2025</div>
                  <div><span>⏰</span> 7:30 PM</div>
                  <div><span>🎟</span> TKT-ARR-00712</div>
                </div>
                <div className="ticket-tear" />
                <div className="ticket-footer">
                  <div className="ticket-qr">▓▓▓<br />▓░▓<br />▓▓▓</div>
                  <div className="ticket-amount">₹2,499</div>
                </div>
              </div>
              <div className="ticket-shadow" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────── */}
      <section className="section cats-section">
        <div className="container">
          <div className="section-head">
            <h2>Browse by Category</h2>
            <p>Find the experience that speaks to you</p>
          </div>
          <div className="cats-grid">
            {CATEGORIES.map(c => (
              <div key={c.name} className="cat-tile" style={{ '--cat-bg': c.color, '--cat-hover': c.hover }}
                onClick={() => navigate(`/events?category=${encodeURIComponent(c.name)}`)}>
                <span className="cat-emoji">{c.emoji}</span>
                <span className="cat-name">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ──────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head between">
            <div><h2>Featured Events</h2><p>Handpicked experiences just for you</p></div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/events?is_featured=true')}>View All →</button>
          </div>
          {loading
            ? <div className="events-skeleton-grid">{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:340,borderRadius:20}}/>)}</div>
            : <div className="events-grid">{featured.map(e => <EventCard key={e.id} event={e}/>)}</div>
          }
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-head center">
            <h2>How EventFlow Works</h2>
            <p>From discovery to your seat in three simple steps</p>
          </div>
          <div className="steps">
            {[
              { num:'01', icon:'🔍', title:'Discover', desc:'Browse thousands of events by category, city, date, or mood. Smart filters help you find exactly what you love.' },
              { num:'02', icon:'🎟', title:'Book',     desc:'Select seats, choose ticket type, apply coupons, and pay securely in under 60 seconds. Instant confirmation.' },
              { num:'03', icon:'✨', title:'Experience', desc:'Show up with your QR ticket, get scanned, and enjoy. Manage or transfer tickets anytime from your dashboard.' },
            ].map((s,i) => (
              <React.Fragment key={s.num}>
                <div className="step-card">
                  <div className="step-num">{s.num}</div>
                  <div className="step-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                {i < 2 && <div className="step-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING EVENTS ──────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-head between">
            <div><h2>Trending Now</h2><p>The events everyone's talking about</p></div>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/events?sort=popular')}>View All →</button>
          </div>
          {loading
            ? <div className="events-skeleton-grid">{Array(3).fill(0).map((_,i)=><div key={i} className="skeleton" style={{height:320,borderRadius:20}}/>)}</div>
            : <div className="events-grid">{trending.slice(0,3).map(e => <EventCard key={e.id} event={e}/>)}</div>
          }
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-head center"><h2>Loved by Event Lovers</h2></div>
          <div className="testi-grid">
            {[
              { initials:'PR', name:'Priya Rajan',  role:'Music Enthusiast, Pune',       text:'Booked tickets for three events in one evening. The UX is incredibly smooth and the e-tickets work flawlessly at entry.' },
              { initials:'AK', name:'Arjun Kapoor', role:'Event Organizer, Mumbai',      text:'As an organizer, the dashboard gives me real-time bookings, attendee lists, and revenue analytics — everything in one place.', featured: true },
              { initials:'SN', name:'Sneha Nair',   role:'Software Developer, Bengaluru', text:'Found a last-minute coding workshop and booked in 2 minutes flat. EventFlow is now my go-to for all tech events.' },
            ].map(t => (
              <div key={t.name} className={`testi-card ${t.featured ? 'featured' : ''}`}>
                <div className="testi-stars">★★★★★</div>
                <p>"{t.text}"</p>
                <div className="testi-author">
                  <div className="testi-avatar">{t.initials}</div>
                  <div><strong>{t.name}</strong><span>{t.role}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner">
            <h2>Ready to host your own event?</h2>
            <p>Join 1,200+ organizers using EventFlow to sell tickets, manage attendees, and grow their audience.</p>
            <div className="cta-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/register?role=organizer')}>Start as Organizer</button>
              <button className="btn btn-ghost-white btn-lg" onClick={() => navigate('/events')}>Browse Events</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────── */}
      <section className="section newsletter-section">
        <div className="container">
          <div className="newsletter-box">
            <div>
              <h3>Stay in the Loop</h3>
              <p>Get the best upcoming events delivered to your inbox every week.</p>
            </div>
            <form className="newsletter-form" onSubmit={handleNewsletter}>
              <input type="email" placeholder="your@email.com" value={newsletter} onChange={e => setNewsletter(e.target.value)} required />
              <button type="submit" className="btn btn-primary btn-md" disabled={nlLoading}>
                {nlLoading ? <Spinner size={18} /> : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
