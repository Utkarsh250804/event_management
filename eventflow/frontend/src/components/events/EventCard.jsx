import React from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { StatusBadge, Stars } from '../ui'
import './EventCard.css'

const CAT_COLORS = {
  Music:           'linear-gradient(135deg,#0B1622,#1A2744)',
  Tech:            'linear-gradient(135deg,#0D1F3C,#1B3058)',
  Sports:          'linear-gradient(135deg,#0D2818,#1A4A2A)',
  'Food & Drink':  'linear-gradient(135deg,#2D0D0D,#501A1A)',
  Arts:            'linear-gradient(135deg,#200D30,#3D1858)',
  Business:        'linear-gradient(135deg,#0D1B30,#1A3060)',
  Education:       'linear-gradient(135deg,#0D2020,#1A3A3A)',
  'Health & Wellness': 'linear-gradient(135deg,#0D2520,#1A4035)',
  Other:           'linear-gradient(135deg,#1A1A2A,#2A2A3A)',
}

export default function EventCard({ event, compact }) {
  const navigate = useNavigate()
  const avail = event.total_seats - event.booked_seats
  const pct = (event.booked_seats / event.total_seats) * 100

  const seatStatus = pct >= 95 ? 'sold-out' : pct >= 75 ? 'low' : 'ok'
  const seatLabel  = pct >= 95 ? 'Sold Out' : `${avail} left`

  const dateStr = event.event_date
    ? format(new Date(event.event_date), 'dd MMM yyyy')
    : ''

  const bg = CAT_COLORS[event.category] || CAT_COLORS.Other

  return (
    <div className={`ecard ${compact ? 'ecard-compact' : ''}`} onClick={() => navigate(`/events/${event.id}`)}>
      <div className="ecard-image" style={{ background: bg }}>
        {event.badge && <span className="ecard-badge">{event.badge}</span>}
        {event.is_featured && !event.badge && <span className="ecard-badge">✦ Featured</span>}
        <span className="ecard-emoji">{event.icon_emoji || '🎪'}</span>
        <div className="ecard-cat">{event.category}</div>
      </div>

      <div className="ecard-body">
        <h3 className="ecard-title">{event.title}</h3>
        <div className="ecard-meta">
          <span>📅 {dateStr}</span>
          <span>📍 {event.city || event.venue_name}</span>
          {event.organizer_name && <span>👤 {event.organizer_name}</span>}
        </div>

        {event.avg_rating ? (
          <div className="ecard-rating">
            <Stars rating={event.avg_rating} />
            <span>{event.avg_rating} ({event.review_count})</span>
          </div>
        ) : null}

        <div className="ecard-footer">
          <div>
            <div className="ecard-price">
              ₹{event.standard_price?.toLocaleString('en-IN')}
              {event.original_price && event.original_price > event.standard_price && (
                <span className="ecard-orig">₹{event.original_price.toLocaleString('en-IN')}</span>
              )}
            </div>
            <span className={`ecard-seats ${seatStatus}`}>{seatLabel}</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); navigate(`/events/${event.id}`) }}>
            Book Now
          </button>
        </div>

        {pct > 0 && (
          <div className="ecard-progress">
            <div className="ecard-progress-bar" style={{ width:`${Math.min(pct,100)}%`, background: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#22C55E' }} />
          </div>
        )}
      </div>
    </div>
  )
}
