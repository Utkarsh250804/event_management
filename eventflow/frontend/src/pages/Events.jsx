import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { eventsAPI } from '../api'
import EventCard from '../components/events/EventCard'
import { Pagination, Spinner, Empty } from '../components/ui'
import './Events.css'

const CATEGORIES = ['Music','Tech','Sports','Food & Drink','Arts','Business','Education','Health & Wellness','Other']
const CITIES     = ['Mumbai','Delhi','Bengaluru','Goa','Pune','Hyderabad','Chennai','Kolkata']
const SORT_OPTS  = [
  { v:'date_asc',   l:'Date (Soonest)' },
  { v:'date_desc',  l:'Date (Latest)' },
  { v:'price_asc',  l:'Price: Low → High' },
  { v:'price_desc', l:'Price: High → Low' },
  { v:'popular',    l:'Most Popular' },
  { v:'newest',     l:'Newly Added' },
]

export default function Events() {
  const [sp, setSp] = useSearchParams()
  const [events, setEvents]   = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [view, setView]       = useState('grid')

  const [filters, setFilters] = useState({
    q:          sp.get('q')        || '',
    category:   sp.get('category') || '',
    city:       sp.get('city')     || '',
    sort:       sp.get('sort')     || 'date_asc',
    min_price:  '',
    max_price:  sp.get('max_price') || '',
    is_featured: sp.get('is_featured') || '',
    is_online:  '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 9 }
      Object.entries(filters).forEach(([k,v]) => { if (v !== '') params[k] = v })
      const { data } = await eventsAPI.list(params)
      setEvents(data.events)
      setTotal(data.total)
    } catch { setEvents([]) }
    setLoading(false)
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const setFilter = (k, v) => { setFilters(f => ({...f, [k]: v})); setPage(1) }
  const reset = () => { setFilters({ q:'',category:'',city:'',sort:'date_asc',min_price:'',max_price:'',is_featured:'',is_online:'' }); setPage(1) }

  return (
    <div>
      {/* Page Hero */}
      <div className="page-hero">
        <div className="container">
          <h1>Explore All Events</h1>
          <p>Discover experiences worth making time for — from concerts to conferences.</p>
        </div>
      </div>

      <div className="container">
        <div className="events-layout">
          {/* ── Filters Sidebar ── */}
          <aside className="filters-panel">
            <div className="filters-card">
              <div className="filters-header">
                <span>Filters</span>
                <button onClick={reset} className="filter-reset">Reset</button>
              </div>

              {/* Search */}
              <div className="filter-group">
                <label>Search</label>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', fontSize:'0.85rem' }}>🔍</span>
                  <input className="filter-input" style={{ paddingLeft:34 }} placeholder="Search events..." value={filters.q} onChange={e => setFilter('q', e.target.value)} />
                </div>
              </div>

              {/* Category */}
              <div className="filter-group">
                <label>Category</label>
                <div className="filter-checks">
                  {CATEGORIES.map(c => (
                    <label key={c} className="filter-check">
                      <input type="radio" name="cat" value={c} checked={filters.category===c} onChange={() => setFilter('category', filters.category===c?'':c)} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>

              {/* City */}
              <div className="filter-group">
                <label>City</label>
                <select className="filter-input" value={filters.city} onChange={e => setFilter('city', e.target.value)}>
                  <option value="">All Cities</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Price Range */}
              <div className="filter-group">
                <label>Max Price (₹)</label>
                <input type="range" min="0" max="10000" step="100" value={filters.max_price||10000}
                  onChange={e => setFilter('max_price', e.target.value)}
                  style={{ width:'100%', accentColor:'var(--gold)' }} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', color:'var(--text-3)', marginTop:4 }}>
                  <span>₹0</span>
                  <span>Up to ₹{parseInt(filters.max_price||10000).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="filter-group">
                <label className="filter-check">
                  <input type="checkbox" checked={filters.is_featured==='true'} onChange={e => setFilter('is_featured', e.target.checked?'true':'')} />
                  Featured only
                </label>
                <label className="filter-check" style={{ marginTop:8 }}>
                  <input type="checkbox" checked={filters.is_online==='true'} onChange={e => setFilter('is_online', e.target.checked?'true':'')} />
                  Online events
                </label>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="events-main">
            <div className="events-toolbar">
              <div className="events-count">
                {loading ? <Spinner size={14} /> : `${total} event${total!==1?'s':''} found`}
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <div className="view-toggle">
                  <button className={view==='grid'?'active':''} onClick={()=>setView('grid')}>⊞</button>
                  <button className={view==='list'?'active':''} onClick={()=>setView('list')}>≡</button>
                </div>
                <select className="sort-select" value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
                  {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className={view==='grid' ? 'events-grid' : 'events-list-wrap'}>
                {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: view==='grid'?340:100, borderRadius:16 }} />)}
              </div>
            ) : events.length === 0 ? (
              <Empty icon="🔍" title="No events found" desc="Try adjusting your filters or search term." />
            ) : view === 'grid' ? (
              <div className="events-grid">{events.map(e => <EventCard key={e.id} event={e} />)}</div>
            ) : (
              <div className="events-list-wrap">{events.map(e => <EventListRow key={e.id} event={e} />)}</div>
            )}

            <Pagination page={page} total={total} limit={9} onChange={p => { setPage(p); window.scrollTo(0,0) }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function EventListRow({ event }) {
  const avail = event.total_seats - event.booked_seats
  return (
    <div className="event-list-row" onClick={() => window.location.href=`/events/${event.id}`}>
      <div className="elr-image" style={{ background:`linear-gradient(135deg,#0B1622,#1E2F45)` }}>{event.icon_emoji||'🎪'}</div>
      <div className="elr-body">
        <div className="event-cat-tag">{event.category}</div>
        <h3>{event.title}</h3>
        <p>📅 {event.event_date ? new Date(event.event_date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''} &nbsp;·&nbsp; 📍 {event.city || event.venue_name}</p>
        <div className="elr-tags">{(event.tags||[]).slice(0,3).map(t=><span key={t} className="etag">{t}</span>)}</div>
      </div>
      <div className="elr-right">
        <div className="ecard-price">₹{event.standard_price?.toLocaleString('en-IN')}</div>
        <span className={`ecard-seats ${avail < 20 ? 'low' : 'ok'}`}>{avail} seats left</span>
        <button className="btn btn-primary btn-sm" style={{ marginTop:8 }}>Book Now</button>
      </div>
    </div>
  )
}
