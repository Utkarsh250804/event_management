import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { organizerAPI, eventsAPI, usersAPI as usAPI } from '../api'
import { Btn, StatusBadge, Empty, Spinner, Modal, Input, Select, Textarea } from '../components/ui'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './Dashboard.css'
import './Organizer.css'

const NAV = [
  { path:'/organizer',         icon:'📊', label:'Dashboard'  },
  { path:'/organizer/events',  icon:'🎪', label:'My Events'  },
  { path:'/organizer/create',  icon:'➕', label:'Create Event'},
  { path:'/organizer/revenue', icon:'💰', label:'Revenue'    },
  { path:'/organizer/coupons', icon:'🏷',  label:'Coupons'    },
  { path:'/organizer/profile', icon:'👤', label:'Profile'    },
]

export function OrganizerLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="ds-logo"><Link to="/">Event<span>Flow</span></Link></div>
        <div className="ds-user">
          <div className="ds-avatar" style={{background:'var(--gold)'}}>{user?.name?.[0]}</div>
          <div><div className="ds-name">{user?.name}</div><div className="ds-role">🎪 Organizer</div></div>
        </div>
        <nav className="ds-nav">
          {NAV.map(n => (
            <Link key={n.path} to={n.path} className={`ds-item ${location.pathname===n.path?'active':''}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </nav>
        <div className="ds-footer">
          <Link to="/events" className="ds-item">🔍 Browse Events</Link>
          <Link to="/dashboard" className="ds-item">👤 User Dashboard</Link>
          <button className="ds-item danger" onClick={()=>{logout();navigate('/')}}>🚪 Log Out</button>
        </div>
      </aside>
      <main className="dash-main"><Outlet /></main>
    </div>
  )
}

export function OrganizerDashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    organizerAPI.dashboard().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  if (loading) return <div style={{padding:60,textAlign:'center'}}><Spinner size={36}/></div>

  const stats = data?.stats || {}

  return (
    <div>
      <div className="dash-header">
        <h1>Organizer Dashboard</h1>
        <p>Welcome back, {user?.name?.split(' ')[0]}! Here's your event overview.</p>
      </div>

      <div className="stats-row">
        {[
          {icon:'🎪',value:stats.total_events??0,      label:'Total Events',    color:'#E9A84C'},
          {icon:'👥',value:stats.total_attendees??0,   label:'Total Attendees', color:'#3B82F6'},
          {icon:'💰',value:`₹${(stats.total_revenue??0).toLocaleString('en-IN')}`,label:'Total Revenue',color:'#22C55E'},
          {icon:'📊',value:stats.published_events??0,  label:'Live Events',     color:'#9333EA'},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="sc-icon" style={{background:`${s.color}18`}}>{s.icon}</div>
            <div className="sc-value">{s.value}</div>
            <div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-section">
        <div className="ds-header-row">
          <h2>Recent Events</h2>
          <Link to="/organizer/events" className="view-all-link">View all →</Link>
        </div>
        {(data?.recent_events||[]).length === 0
          ? <Empty icon="🎪" title="No events yet" action={<Link to="/organizer/create" className="btn btn-primary btn-md">Create First Event</Link>} />
          : <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Event</th><th>Date</th><th>Bookings</th><th>Revenue</th><th>Status</th></tr></thead>
              <tbody>
                {(data.recent_events||[]).map(e=>(
                  <tr key={e.id}>
                    <td><div style={{fontWeight:600,color:'var(--navy)'}}>{e.icon_emoji} {e.title}</div></td>
                    <td>{e.event_date?format(new Date(e.event_date),'dd MMM yyyy'):'—'}</td>
                    <td>{e.booked_seats}/{e.total_seats}</td>
                    <td style={{fontWeight:600}}>₹{(e.revenue||0).toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={e.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
        }
      </div>
    </div>
  )
}

export function OrganizerEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(()=>{
    organizerAPI.events().then(r=>setEvents(r.data?.events||r.data||[])).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const publish = async (id) => {
    try { await eventsAPI.publish(id); toast.success('Event published!'); setEvents(ev=>ev.map(e=>e.id===id?{...e,status:'published'}:e)) }
    catch(err){ toast.error(err.response?.data?.detail||'Could not publish') }
  }
  const del = async (id) => {
    if (!confirm('Delete this event?')) return
    try { await eventsAPI.delete(id); toast.success('Deleted'); setEvents(ev=>ev.filter(e=>e.id!==id)) }
    catch{ toast.error('Could not delete') }
  }

  return (
    <div>
      <div className="ds-header-row" style={{marginBottom:24}}>
        <div className="dash-header" style={{marginBottom:0}}><h1>My Events</h1></div>
        <Link to="/organizer/create" className="btn btn-primary btn-md">+ Create Event</Link>
      </div>
      {loading ? <Spinner/> :
       events.length===0 ? <Empty icon="🎪" title="No events yet" action={<Link to="/organizer/create" className="btn btn-primary btn-md">Create First Event</Link>}/> :
       <div className="org-events-list">
         {events.map(e=>(
           <div key={e.id} className="org-event-card">
             <div className="oec-icon">{e.icon_emoji||'🎪'}</div>
             <div className="oec-body">
               <div className="oec-title">{e.title}</div>
               <div className="oec-meta">
                 <span>📅 {e.event_date?format(new Date(e.event_date),'dd MMM yyyy'):'—'}</span>
                 <span>📍 {e.city||e.venue_name}</span>
                 <span>👥 {e.booked_seats}/{e.total_seats} booked</span>
               </div>
               <div className="oec-progress"><div style={{width:`${Math.min((e.booked_seats/e.total_seats)*100,100)}%`,height:'100%',background:'var(--gold)',borderRadius:99}}/></div>
             </div>
             <div className="oec-actions">
               <StatusBadge status={e.status}/>
               <div style={{display:'flex',gap:8,marginTop:10}}>
                 {e.status==='draft'&&<Btn variant="primary" size="sm" onClick={()=>publish(e.id)}>Publish</Btn>}
                 <Btn variant="outline" size="sm" onClick={()=>navigate(`/organizer/edit/${e.id}`)}>Edit</Btn>
                 <Btn variant="danger" size="sm" onClick={()=>del(e.id)}>Delete</Btn>
               </div>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  )
}

const CATEGORIES=['Music','Tech','Sports','Food & Drink','Arts','Business','Education','Health & Wellness','Other']

export function CreateEvent({ editId }) {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title:'', short_description:'', description:'', category:'Music',
    venue_name:'', venue_address:'', city:'', state:'', country:'India',
    event_date:'', end_date:'', total_seats:100,
    standard_price:0, premium_price:'', vip_price:'',
    icon_emoji:'🎪', tags:'', highlights:'', is_online:false,
    is_featured:false, dress_code:'', parking_info:'', refund_policy:'',
  })

  useEffect(()=>{
    if (editId) eventsAPI.byId(editId).then(r=>{
      const e=r.data
      setForm(f=>({...f,...e,tags:(e.tags||[]).join(', '),highlights:(e.highlights||[]).join('\n'),event_date:e.event_date?.slice(0,16)||''}))
    })
  },[editId])

  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const submit=async(e)=>{
    e.preventDefault(); setSaving(true)
    try {
      const toFloat = v => { const n = parseFloat(v); return (v !== '' && v != null && !isNaN(n)) ? n : undefined }
      const toDate  = v => (v && String(v).trim()) ? new Date(v).toISOString() : undefined
      const toStr   = v => (v && String(v).trim()) ? String(v) : undefined
      const payload={
        title: form.title,
        description: form.description,
        category: form.category,
        venue_name: form.venue_name,
        country: form.country || 'India',
        timezone: 'Asia/Kolkata',
        is_online: form.is_online || false,
        is_featured: form.is_featured || false,
        total_seats: parseInt(form.total_seats) || 100,
        standard_price: parseFloat(form.standard_price) || 0,
        icon_emoji: form.icon_emoji || '🎪',
        tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
        highlights: form.highlights ? form.highlights.split('\n').filter(Boolean) : [],
        event_date: toDate(form.event_date),
        short_description: toStr(form.short_description),
        venue_address: toStr(form.venue_address),
        city: toStr(form.city),
        state: toStr(form.state),
        pincode: toStr(form.pincode),
        online_link: toStr(form.online_link),
        online_platform: toStr(form.online_platform),
        dress_code: toStr(form.dress_code),
        parking_info: toStr(form.parking_info),
        refund_policy: toStr(form.refund_policy),
        end_date: toDate(form.end_date),
        early_bird_deadline: toDate(form.early_bird_deadline),
        premium_price: toFloat(form.premium_price),
        vip_price: toFloat(form.vip_price),
        original_price: toFloat(form.original_price),
        early_bird_price: toFloat(form.early_bird_price),
      }
      if(editId) await eventsAPI.update(editId,payload); else await eventsAPI.create(payload)
      toast.success(editId?'Event updated!':'Event created!')
      navigate('/organizer/events')
    }catch(err){toast.error(err.response?.data?.detail||'Could not save event')}
    finally{setSaving(false)}
  }

  return (
    <div>
      <div className="dash-header"><h1>{editId?'Edit Event':'Create New Event'}</h1><p>Fill in the details to {editId?'update':'list'} your event.</p></div>
      <form onSubmit={submit} className="event-form">

        <div className="ef-section"><h3>Basic Details</h3>
          <div className="form-row-2">
            <Input label="Event Title *" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Sunburn Festival 2025" required />
            <Select label="Category *" value={form.category} onChange={e=>set('category',e.target.value)}>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </Select>
          </div>
          <Input label="Short Description" value={form.short_description} onChange={e=>set('short_description',e.target.value)} placeholder="One-line summary" />
          <Textarea label="Full Description *" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe your event in detail..." required />
          <div className="form-row-2">
            <Input label="Icon Emoji" value={form.icon_emoji} onChange={e=>set('icon_emoji',e.target.value)} placeholder="🎪" />
            <Input label="Tags (comma separated)" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="Music, Outdoor, Festival" />
          </div>
          <div className="field">
            <label className="field-label">Highlights (one per line)</label>
            <textarea className="field-input field-textarea" style={{minHeight:80}} value={form.highlights} onChange={e=>set('highlights',e.target.value)} placeholder="50+ DJs&#10;4 Stages&#10;Camping Available" />
          </div>
        </div>

        <div className="ef-section"><h3>Date & Venue</h3>
          <div className="form-row-2">
            <Input label="Event Date & Time *" type="datetime-local" value={form.event_date} onChange={e=>set('event_date',e.target.value)} required />
            <Input label="End Date & Time" type="datetime-local" value={form.end_date} onChange={e=>set('end_date',e.target.value)} />
          </div>
          <div className="form-row-2">
            <Input label="Venue Name *" value={form.venue_name} onChange={e=>set('venue_name',e.target.value)} placeholder="e.g. DY Patil Stadium" required />
            <Input label="City" value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Mumbai" />
          </div>
          <Input label="Full Address" value={form.venue_address} onChange={e=>set('venue_address',e.target.value)} placeholder="Street, Area, City" />
          <div style={{display:'flex',gap:20}}>
            <label className="filter-check"><input type="checkbox" checked={form.is_online} onChange={e=>set('is_online',e.target.checked)} style={{accentColor:'var(--gold)'}} /> Online Event</label>
            <label className="filter-check"><input type="checkbox" checked={form.is_featured} onChange={e=>set('is_featured',e.target.checked)} style={{accentColor:'var(--gold)'}} /> Mark as Featured</label>
          </div>
        </div>

        <div className="ef-section"><h3>Tickets & Pricing</h3>
          <div className="form-row-3">
            <Input label="Total Seats *" type="number" min="1" value={form.total_seats} onChange={e=>set('total_seats',e.target.value)} required />
            <Input label="Standard Price (₹) *" type="number" min="0" step="0.01" value={form.standard_price} onChange={e=>set('standard_price',e.target.value)} required />
            <Input label="Premium Price (₹)" type="number" min="0" step="0.01" value={form.premium_price} onChange={e=>set('premium_price',e.target.value)} placeholder="Optional" />
          </div>
          <div className="form-row-2">
            <Input label="VIP Price (₹)" type="number" min="0" step="0.01" value={form.vip_price} onChange={e=>set('vip_price',e.target.value)} placeholder="Optional" />
            <Input label="Dress Code" value={form.dress_code} onChange={e=>set('dress_code',e.target.value)} placeholder="Smart Casual" />
          </div>
          <Textarea label="Refund Policy" value={form.refund_policy} onChange={e=>set('refund_policy',e.target.value)} placeholder="Describe your cancellation and refund policy..." />
        </div>

        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <Btn type="button" variant="outline" size="md" onClick={()=>navigate('/organizer/events')}>Cancel</Btn>
          <Btn type="submit" variant="primary" size="md" loading={saving}>{editId?'Update Event':'Create Event'}</Btn>
        </div>
      </form>
    </div>
  )
}

// ── Organizer Profile Page ────────────────────────────────────
export function OrganizerProfile() {
  const { user, updateUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' })
  const [pwdSaving, setPwdSaving] = useState(false)

  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '', city: user?.city || ''
  })
  const [orgForm, setOrgForm] = useState({
    organization_name: '', website: '', description: '',
    social_instagram: '', social_twitter: '', social_linkedin: '',
    pan_number: '', gst_number: ''
  })

  useEffect(() => {
    organizerAPI.getProfile()
      .then(r => {
        setProfile(r.data)
        setOrgForm(f => ({ ...f, ...r.data }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const savePersonal = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await usAPI.updateProfile(form)
      updateUser(data); toast.success('Profile updated!')
    } catch { toast.error('Could not update profile') }
    finally { setSaving(false) }
  }

  const saveOrg = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await organizerAPI.updateProfile(orgForm)
      toast.success('Organization profile saved!')
    } catch { toast.error('Could not save') }
    finally { setSaving(false) }
  }

  const changePwd = async (e) => {
    e.preventDefault()
    if (pwdForm.new_password !== pwdForm.confirm) { toast.error('Passwords do not match'); return }
    setPwdSaving(true)
    try {
      await usAPI.changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password })
      toast.success('Password changed!')
      setPwdForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.detail || 'Could not change password') }
    finally { setPwdSaving(false) }
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}><Spinner size={36} /></div>

  return (
    <div>
      <div className="dash-header"><h1>My Profile</h1><p>Manage your personal and organization details.</p></div>

      <div className="profile-grid">
        {/* Personal Info */}
        <div className="dash-card">
          <h3>Personal Information</h3>
          <form onSubmit={savePersonal} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            <Input label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
            <Input label="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <div className="field">
              <label className="field-label">Bio</label>
              <textarea className="field-input field-textarea" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell attendees about yourself..." />
            </div>
            <Btn type="submit" variant="primary" size="md" loading={saving}>Save Changes</Btn>
          </form>
        </div>

        <div>
          {/* Account Info */}
          <div className="dash-card" style={{ marginBottom: 20 }}>
            <h3>Account</h3>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="profile-info-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="profile-info-row"><span>Role</span><strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong></div>
              <div className="profile-info-row"><span>Verified</span><strong>{profile?.verified ? '✅ Verified' : '⏳ Pending'}</strong></div>
            </div>
          </div>

          {/* Change Password */}
          <div className="dash-card">
            <h3>Change Password</h3>
            <form onSubmit={changePwd} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
              <Input label="Current Password" type="password" value={pwdForm.current_password} onChange={e => setPwdForm(f => ({ ...f, current_password: e.target.value }))} />
              <Input label="New Password" type="password" value={pwdForm.new_password} onChange={e => setPwdForm(f => ({ ...f, new_password: e.target.value }))} />
              <Input label="Confirm New Password" type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} />
              <Btn type="submit" variant="secondary" size="md" loading={pwdSaving}>Change Password</Btn>
            </form>
          </div>
        </div>
      </div>

      {/* Organization Profile */}
      <div className="dash-card" style={{ marginTop: 24 }}>
        <h3>Organization Profile</h3>
        <form onSubmit={saveOrg} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <Input label="Organization Name" value={orgForm.organization_name || ''} onChange={e => setOrgForm(f => ({ ...f, organization_name: e.target.value }))} placeholder="EventCo Productions" />
          <Input label="Website" value={orgForm.website || ''} onChange={e => setOrgForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yoursite.com" />
          <Input label="Instagram" value={orgForm.social_instagram || ''} onChange={e => setOrgForm(f => ({ ...f, social_instagram: e.target.value }))} placeholder="@handle" />
          <Input label="Twitter / X" value={orgForm.social_twitter || ''} onChange={e => setOrgForm(f => ({ ...f, social_twitter: e.target.value }))} placeholder="@handle" />
          <Input label="PAN Number" value={orgForm.pan_number || ''} onChange={e => setOrgForm(f => ({ ...f, pan_number: e.target.value }))} placeholder="ABCDE1234F" />
          <Input label="GST Number" value={orgForm.gst_number || ''} onChange={e => setOrgForm(f => ({ ...f, gst_number: e.target.value }))} placeholder="22ABCDE0000A1Z5" />
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="field">
              <label className="field-label">Organization Description</label>
              <textarea className="field-input field-textarea" value={orgForm.description || ''} onChange={e => setOrgForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell attendees about your organization..." />
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <Btn type="submit" variant="primary" size="md" loading={saving}>Save Organization Profile</Btn>
          </div>
        </form>
      </div>
    </div>
  )
}