import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { bookingsAPI, usersAPI } from '../api'
import { Btn, StatusBadge, Empty, Spinner, Modal, Input } from '../components/ui'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './Dashboard.css'

const NAV_ITEMS = [
  { path:'/dashboard',               icon:'📊', label:'Overview' },
  { path:'/dashboard/bookings',       icon:'🎟', label:'My Bookings' },
  { path:'/dashboard/wishlist',       icon:'❤️', label:'Wishlist' },
  { path:'/dashboard/notifications',  icon:'🔔', label:'Notifications' },
  { path:'/dashboard/profile',        icon:'👤', label:'Profile' },
]

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="ds-logo"><Link to="/">Event<span>Flow</span></Link></div>
        <div className="ds-user">
          <div className="ds-avatar">{user?.name?.[0]}</div>
          <div><div className="ds-name">{user?.name}</div><div className="ds-role">{user?.role}</div></div>
        </div>
        <nav className="ds-nav">
          {NAV_ITEMS.map(n => (
            <Link key={n.path} to={n.path} className={`ds-item ${location.pathname===n.path?'active':''}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="ds-footer">
          <Link to="/events" className="ds-item">🔍 Browse Events</Link>
          <button className="ds-item danger" onClick={()=>{logout();navigate('/')}}>🚪 Log Out</button>
        </div>
      </aside>
      <main className="dash-main"><Outlet /></main>
    </div>
  )
}

export function DashboardOverview() {
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookingsAPI.my().then(r => setBookings(r.data?.bookings || [])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const stats = {
    total:     bookings.length,
    confirmed: bookings.filter(b=>b.status==='confirmed').length,
    upcoming:  bookings.filter(b=>b.status==='confirmed' && new Date(b.event_date)>new Date()).length,
    spent:     bookings.filter(b=>b.status!=='cancelled').reduce((s,b)=>s+b.total_amount,0),
  }

  return (
    <div>
      <div className="dash-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p>Here's what's happening with your events.</p>
      </div>

      <div className="stats-row">
        {[
          { icon:'🎟', value:stats.total,     label:'Total Bookings',  color:'#E9A84C' },
          { icon:'✅', value:stats.confirmed, label:'Confirmed',       color:'#22C55E' },
          { icon:'📅', value:stats.upcoming,  label:'Upcoming Events', color:'#3B82F6' },
          { icon:'💸', value:`₹${stats.spent.toLocaleString('en-IN')}`, label:'Total Spent', color:'#9333EA' },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="sc-icon" style={{ background:`${s.color}18` }}>{s.icon}</div>
            <div className="sc-value">{s.value}</div>
            <div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-section">
        <div className="ds-header-row">
          <h2>Recent Bookings</h2>
          <Link to="/dashboard/bookings" className="view-all-link">View all →</Link>
        </div>
        {loading ? <Spinner /> :
         bookings.length === 0 ? <Empty icon="🎟" title="No bookings yet" desc="Browse events and book your first ticket!" action={<Link to="/events" className="btn btn-primary btn-md">Browse Events</Link>} /> :
         <div className="tbl-wrap">
           <table className="tbl">
             <thead><tr><th>Event</th><th>Date</th><th>Tickets</th><th>Amount</th><th>Status</th></tr></thead>
             <tbody>
               {bookings.slice(0,5).map(b=>(
                 <tr key={b.id}>
                   <td><div style={{fontWeight:600,color:'var(--navy)'}}>{b.event_title}</div><div style={{fontSize:'0.78rem',color:'var(--text-3)'}}>{b.ticket_id}</div></td>
                   <td>{b.event_date ? format(new Date(b.event_date),'dd MMM yyyy') : '—'}</td>
                   <td>{b.quantity} × {b.ticket_type}</td>
                   <td style={{fontWeight:600}}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                   <td><StatusBadge status={b.status} /></td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
        }
      </div>
    </div>
  )
}

export function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const load = () => {
    setLoading(true)
    bookingsAPI.my().then(r=>setBookings(r.data?.bookings || [])).catch(()=>{}).finally(()=>setLoading(false))
  }
  useEffect(load, [])

  const doCancel = async () => {
    setCancelling(true)
    try {
      await bookingsAPI.cancel(cancelModal.id)
      toast.success('Booking cancelled')
      setCancelModal(null)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Could not cancel') }
    finally { setCancelling(false) }
  }

  return (
    <div>
      <div className="dash-header"><h1>My Bookings</h1><p>All your event tickets in one place.</p></div>
      {loading ? <div style={{padding:60,textAlign:'center'}}><Spinner size={36}/></div> :
       bookings.length === 0 ? <Empty icon="🎟" title="No bookings yet" action={<Link to="/events" className="btn btn-primary btn-md">Browse Events</Link>} /> :
       <div className="bookings-list">
         {bookings.map(b => (
           <div key={b.id} className="booking-card">
             <div className="bc-icon">{b.event_icon || '🎪'}</div>
             <div className="bc-body">
               <div className="bc-title">{b.event_title}</div>
               <div className="bc-meta">
                 <span>📅 {b.event_date ? format(new Date(b.event_date),'dd MMM yyyy, h:mm a') : '—'}</span>
                 <span>📍 {b.event_location}</span>
                 <span>🎟 {b.ticket_id}</span>
               </div>
               <div className="bc-footer">
                 <div><span className="bc-type">{b.quantity} × {b.ticket_type}</span><span className="bc-amount">₹{b.total_amount?.toLocaleString('en-IN')}</span></div>
                 <div style={{display:'flex',gap:8,alignItems:'center'}}>
                   <StatusBadge status={b.status}/>
                   {b.status==='confirmed' && new Date(b.event_date)>new Date() && (
                     <Btn variant="outline" size="sm" onClick={()=>setCancelModal(b)}>Cancel</Btn>
                   )}
                 </div>
               </div>
             </div>
           </div>
         ))}
       </div>
      }

      <Modal open={!!cancelModal} onClose={()=>setCancelModal(null)} title="Cancel Booking">
        <p style={{color:'var(--text-2)',marginBottom:20}}>Are you sure you want to cancel <strong>{cancelModal?.event_title}</strong>? This action may not be reversible depending on the refund policy.</p>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <Btn variant="outline" size="md" onClick={()=>setCancelModal(null)}>Keep Booking</Btn>
          <Btn variant="danger" size="md" loading={cancelling} onClick={doCancel}>Yes, Cancel</Btn>
        </div>
      </Modal>
    </div>
  )
}

export function Profile() {
  const { user, updateUser } = useAuthStore()
  const [form, setForm] = useState({ name:user?.name||'', phone:user?.phone||'', bio:user?.bio||'', city:user?.city||'' })
  const [pwdForm, setPwdForm] = useState({ current_password:'', new_password:'', confirm:'' })
  const [saving, setSaving] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await usersAPI.updateProfile(form)
      updateUser(data); toast.success('Profile updated!')
    } catch { toast.error('Could not update profile') }
    finally { setSaving(false) }
  }

  const changePwd = async (e) => {
    e.preventDefault()
    if (pwdForm.new_password !== pwdForm.confirm) { toast.error('Passwords do not match'); return }
    setPwdSaving(true)
    try {
      await usersAPI.changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password })
      toast.success('Password changed!')
      setPwdForm({ current_password:'', new_password:'', confirm:'' })
    } catch (err) { toast.error(err.response?.data?.detail || 'Could not change password') }
    finally { setPwdSaving(false) }
  }

  return (
    <div>
      <div className="dash-header"><h1>My Profile</h1><p>Manage your account information.</p></div>
      <div className="profile-grid">
        <div className="dash-card">
          <h3>Personal Information</h3>
          <form onSubmit={saveProfile} style={{display:'flex',flexDirection:'column',gap:16,marginTop:20}}>
            <Input label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <Input label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91 98765 43210" />
            <Input label="City" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Mumbai" />
            <div className="field">
              <label className="field-label">Bio</label>
              <textarea className="field-input field-textarea" value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Tell us about yourself..." />
            </div>
            <Btn type="submit" variant="primary" size="md" loading={saving}>Save Changes</Btn>
          </form>
        </div>

        <div>
          <div className="dash-card" style={{marginBottom:20}}>
            <h3>Account</h3>
            <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:10}}>
              <div className="profile-info-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="profile-info-row"><span>Role</span><strong style={{textTransform:'capitalize'}}>{user?.role}</strong></div>
              <div className="profile-info-row"><span>Member since</span><strong>{user?.created_at ? format(new Date(user.created_at),'MMM yyyy') : '—'}</strong></div>
              <div className="profile-info-row"><span>Verified</span><strong>{user?.is_verified ? '✅ Yes' : '❌ No'}</strong></div>
            </div>
          </div>

          <div className="dash-card">
            <h3>Change Password</h3>
            <form onSubmit={changePwd} style={{display:'flex',flexDirection:'column',gap:14,marginTop:20}}>
              <Input label="Current Password" type="password" value={pwdForm.current_password} onChange={e=>setPwdForm(f=>({...f,current_password:e.target.value}))} />
              <Input label="New Password" type="password" value={pwdForm.new_password} onChange={e=>setPwdForm(f=>({...f,new_password:e.target.value}))} />
              <Input label="Confirm New Password" type="password" value={pwdForm.confirm} onChange={e=>setPwdForm(f=>({...f,confirm:e.target.value}))} />
              <Btn type="submit" variant="secondary" size="md" loading={pwdSaving}>Change Password</Btn>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}