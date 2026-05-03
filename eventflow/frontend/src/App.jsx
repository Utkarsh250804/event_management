import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import { ProtectedRoute, GuestRoute } from './components/auth/Guards'

import Home          from './pages/Home'
import Events        from './pages/Events'
import EventDetail   from './pages/EventDetail'
import { Login, Register } from './pages/Auth'
import Contact       from './pages/Contact'

import {
  DashboardLayout, DashboardOverview, MyBookings, Profile
} from './pages/Dashboard'

import {
  OrganizerLayout, OrganizerDashboard, OrganizerEvents, CreateEvent, OrganizerProfile
} from './pages/Organizer'

import {
  AdminLayout, AdminOverview, AdminUsers, AdminEvents, AdminRefunds
} from './pages/Admin'

import { organizerAPI, usersAPI, adminAPI } from './api'
import { Btn, StatusBadge, Empty, Spinner, Input, Select } from './components/ui'
import EventCard from './components/events/EventCard'
import { format } from 'date-fns'

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{
        style: { fontFamily: 'Outfit, sans-serif', fontSize: '0.9rem', borderRadius: 10, background: '#0B1622', color: '#fff' },
        success: { iconTheme: { primary: '#E9A84C', secondary: '#0B1622' } },
      }} />

      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/events" element={<PublicLayout><Events /></PublicLayout>} />
        <Route path="/events/:id" element={<PublicLayout><EventDetail /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/organizer-info" element={<PublicLayout><OrganizerInfo /></PublicLayout>} />

        {/* Auth (guest only) */}
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        {/* User Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardOverview />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Organizer Dashboard */}
        <Route path="/organizer" element={<ProtectedRoute role="organizer"><OrganizerLayout /></ProtectedRoute>}>
          <Route index element={<OrganizerDashboard />} />
          <Route path="events" element={<OrganizerEvents />} />
          <Route path="create" element={<CreateEvent />} />
          <Route path="edit/:editId" element={<EditEventWrapper />} />
          <Route path="revenue" element={<RevenuePage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="profile" element={<OrganizerProfile />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="refunds" element={<AdminRefunds />} />
          <Route path="contacts" element={<AdminContactsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

/* ── Inline simple pages ─────────────────────────────── */
function OrganizerInfo() {
  const navigate = useNavigate()
  return (
    <div>
      <div className="page-hero"><div className="container"><h1>Host on EventFlow</h1><p>Everything you need to run successful events.</p></div></div>
      <div className="container section">
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,marginBottom:48}}>
          {[['🎟','Easy Ticketing','Create multiple ticket tiers with custom pricing, early bird discounts, and group offers.'],
            ['📊','Live Analytics','Track sales, revenue, and attendee data in real time from your organizer dashboard.'],
            ['💬','Attendee Management','View attendee lists, send updates, check-in guests with QR scanning.'],
            ['💸','Fast Payouts','Revenue is settled directly to your bank account within 5 business days.'],
            ['🏷','Coupon Builder','Create discount coupons with usage limits, expiry dates, and minimum amounts.'],
            ['📩','Email Notifications','Automatic confirmation emails sent to attendees on booking and cancellation.'],
          ].map(([icon,t,d])=>(
            <div key={t} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:28}}>
              <div style={{fontSize:'2rem',marginBottom:14}}>{icon}</div>
              <h3 style={{marginBottom:8}}>{t}</h3>
              <p style={{color:'var(--text-2)',fontSize:'0.9rem',lineHeight:1.7}}>{d}</p>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center'}}>
          <h2 style={{marginBottom:14}}>Ready to get started?</h2>
          <p style={{color:'var(--text-2)',marginBottom:24}}>Create your organizer account and list your first event in minutes.</p>
          <button className="btn btn-primary btn-lg" onClick={()=>navigate('/register?role=organizer')}>Start Hosting →</button>
        </div>
      </div>
    </div>
  )
}

function WishlistPage() {
  const [items, setItems] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(()=>{ usersAPI.myWishlist().then(r=>setItems(r.data||[])).catch(()=>{}).finally(()=>setLoading(false)) },[])
  return (
    <div>
      <div className="dash-header"><h1>My Wishlist</h1></div>
      {loading?<Spinner/>:items.length===0?<Empty icon="❤️" title="No saved events" desc="Browse events and save your favourites." action={<a href="/events" className="btn btn-primary btn-md">Browse Events</a>}/>:
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20}}>
          {items.map(e=><EventCard key={e.id} event={e} />)}
        </div>
      }
    </div>
  )
}

function NotificationsPage() {
  const [notifs, setNotifs] = React.useState([])
  React.useEffect(()=>{ usersAPI.notifications().then(r=>setNotifs(r.data||[])).catch(()=>{}) },[])
  return (
    <div>
      <div className="dash-header"><h1>Notifications</h1></div>
      {notifs.length===0?<Empty icon="🔔" title="No notifications yet"/>:
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {notifs.map(n=>(
            <div key={n.id} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'14px 18px',display:'flex',gap:14,alignItems:'flex-start',opacity:n.is_read?0.65:1}}>
              <span style={{fontSize:'1.3rem'}}>{n.icon||'🔔'}</span>
              <div><div style={{fontWeight:600,fontSize:'0.9rem',color:'var(--navy)',marginBottom:3}}>{n.title}</div><div style={{fontSize:'0.84rem',color:'var(--text-2)'}}>{n.message}</div></div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}

function EditEventWrapper() {
  const { editId } = useParams()
  return <CreateEvent editId={editId} />
}

function RevenuePage() {
  const [data, setData] = React.useState(null)
  React.useEffect(()=>{ organizerAPI.revenue().then(r=>setData(r.data)).catch(()=>{}) },[])
  return (
    <div>
      <div className="dash-header"><h1>Revenue</h1><p>Your earnings overview.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18,marginBottom:28}}>
        {[['💰','Total Revenue',data?.total_revenue],['📅','This Month',data?.this_month],['📊','Avg per Event',data?.avg_per_event]].map(([i,l,v])=>(
          <div key={l} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24}}>
            <div style={{fontSize:'1.6rem',marginBottom:10}}>{i}</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:'1.7rem',color:'var(--navy)',fontWeight:600}}>₹{(v||0).toLocaleString('en-IN')}</div>
            <div style={{fontSize:'0.82rem',color:'var(--text-3)',marginTop:4}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CouponsPage() {
  const [coupons, setCoupons] = React.useState([])
  const [creating, setCreating] = React.useState(false)
  const [form, setForm] = React.useState({code:'',type:'percentage',value:'',min_order_amount:'',max_uses:'',valid_until:''})
  const loadCoupons = () => organizerAPI.coupons().then(r=>setCoupons(r.data||[])).catch(()=>{})
  React.useEffect(()=>{ loadCoupons() },[])
  const save=async(e)=>{ e.preventDefault(); try{
    const payload = {
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : undefined,
    }
    await organizerAPI.createCoupon(payload)
    toast.success('Coupon created!')
    setCreating(false)
    setForm({code:'',type:'percentage',value:'',min_order_amount:'',max_uses:'',valid_until:''})
    loadCoupons()
  }catch(err){toast.error(err.response?.data?.detail||'Failed')} }
  const { Input: _I, Select: _S } = { _I: Input, _S: Select }  // noop, already imported
  return (
    <div>
      <div className="ds-header-row" style={{marginBottom:24}}>
        <div className="dash-header" style={{marginBottom:0}}><h1>Coupons</h1></div>
        <Btn variant="primary" size="md" onClick={()=>setCreating(!creating)}>+ New Coupon</Btn>
      </div>
      {creating&&<div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24,marginBottom:24}}>
        <form onSubmit={save} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <Input label="Coupon Code" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} placeholder="WELCOME20" required />
          <Select label="Discount Type" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="percentage">Percentage (%)</option><option value="flat">Fixed Amount (₹)</option></Select>
          <Input label="Discount Value" type="number" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))} required />
          <Input label="Min Order Amount" type="number" value={form.min_order_amount} onChange={e=>setForm(f=>({...f,min_order_amount:e.target.value}))} placeholder="Optional" />
          <Input label="Max Uses" type="number" value={form.max_uses} onChange={e=>setForm(f=>({...f,max_uses:e.target.value}))} placeholder="Unlimited" />
          <Input label="Expires At" type="date" value={form.valid_until} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))} />
          <div style={{gridColumn:'1/-1',display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn type="button" variant="outline" size="md" onClick={()=>setCreating(false)}>Cancel</Btn>
            <Btn type="submit" variant="primary" size="md">Create Coupon</Btn>
          </div>
        </form>
      </div>}
      <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24}}>
        {coupons.length===0?<div style={{textAlign:'center',padding:40,color:'var(--text-3)'}}>No coupons yet</div>:
        <table className="tbl"><thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Max</th><th>Expires</th></tr></thead>
          <tbody>{coupons.map(c=><tr key={c.id}><td style={{fontFamily:'monospace',fontWeight:700}}>{c.code}</td><td>{c.type}</td><td>{c.type==='percentage'?`${c.value}%`:`₹${c.value}`}</td><td>{c.used_count||0}</td><td>{c.max_uses||'∞'}</td><td>{c.valid_until?c.valid_until.slice(0,10):'Never'}</td></tr>)}
          </tbody>
        </table>}
      </div>
    </div>
  )

}

function AdminBookingsPage() {
  const [bookings, setBookings] = React.useState([])
  React.useEffect(()=>{ adminAPI.bookings({limit:50}).then(r=>setBookings(r.data?.bookings||r.data||[])).catch(()=>{}) },[])
  return (
    <div>
      <div className="dash-header"><h1>All Bookings</h1></div>
      <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24}}>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Ticket ID</th><th>User</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{bookings.map(b=><tr key={b.id}><td style={{fontFamily:'monospace',fontSize:'0.78rem'}}>{b.ticket_id}</td><td>{b.user?.name}</td><td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.event?.title}</td><td>{b.created_at?format(new Date(b.created_at),'dd MMM yyyy'):'—'}</td><td style={{fontWeight:600}}>₹{b.total_amount?.toLocaleString('en-IN')}</td><td><StatusBadge status={b.status}/></td></tr>)}
          </tbody>
        </table></div>
      </div>
    </div>
  )
}

function AdminContactsPage() {
  const [contacts, setContacts] = React.useState([])
  React.useEffect(()=>{ adminAPI.contacts().then(r=>setContacts(r.data||[])).catch(()=>{}) },[])
  return (
    <div>
      <div className="dash-header"><h1>Contact Messages</h1></div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {contacts.map(c=>(
          <div key={c.id} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <div style={{fontWeight:600,color:'var(--navy)'}}>{c.name} <span style={{fontWeight:400,color:'var(--text-3)',fontSize:'0.82rem'}}>— {c.email}</span></div>
              <div style={{fontSize:'0.78rem',color:'var(--text-3)'}}>{c.created_at?format(new Date(c.created_at),'dd MMM yyyy, h:mm a'):'—'}</div>
            </div>
            <div style={{fontSize:'0.88rem',fontWeight:600,color:'var(--text-2)',marginBottom:5}}>{c.subject}</div>
            <div style={{fontSize:'0.88rem',color:'var(--text-2)',lineHeight:1.7}}>{c.message}</div>
          </div>
        ))}
        {contacts.length===0&&<div style={{textAlign:'center',padding:60,color:'var(--text-3)'}}>No contact messages yet</div>}
      </div>
    </div>
  )
}
