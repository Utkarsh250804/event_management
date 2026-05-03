import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { adminAPI } from '../api'
import { Btn, StatusBadge, Empty, Spinner, Modal } from '../components/ui'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import './Dashboard.css'

const NAV = [
  { path:'/admin',           icon:'📊', label:'Overview'  },
  { path:'/admin/users',     icon:'👥', label:'Users'     },
  { path:'/admin/events',    icon:'🎪', label:'Events'    },
  { path:'/admin/bookings',  icon:'🎟', label:'Bookings'  },
  { path:'/admin/refunds',   icon:'💸', label:'Refunds'   },
  { path:'/admin/contacts',  icon:'📩', label:'Contacts'  },
]

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="ds-logo"><Link to="/">Event<span>Flow</span></Link></div>
        <div className="ds-user">
          <div className="ds-avatar" style={{background:'#EF4444'}}>{user?.name?.[0]}</div>
          <div><div className="ds-name">{user?.name}</div><div className="ds-role">👑 Admin</div></div>
        </div>
        <nav className="ds-nav">
          {NAV.map(n=>(
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

export function AdminOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{ adminAPI.dashboard().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false)) },[])
  if (loading) return <div style={{padding:60,textAlign:'center'}}><Spinner size={36}/></div>
  const s = data?.stats || {}
  return (
    <div>
      <div className="dash-header"><h1>Admin Dashboard</h1><p>Platform overview and controls.</p></div>
      <div className="stats-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        {[
          {icon:'👥',value:s.total_users??0,      label:'Total Users',   color:'#3B82F6'},
          {icon:'🎪',value:s.total_events??0,     label:'Total Events',  color:'#E9A84C'},
          {icon:'🎟',value:s.total_bookings??0,   label:'Total Bookings',color:'#22C55E'},
          {icon:'💰',value:`₹${(s.total_revenue??0).toLocaleString('en-IN')}`,label:'Total Revenue',color:'#9333EA'},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="sc-icon" style={{background:`${s.color}18`}}>{s.icon}</div>
            <div className="sc-value">{s.value}</div>
            <div className="sc-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:22}}>
        <div className="dash-section">
          <div className="ds-header-row"><h2>Recent Bookings</h2><Link to="/admin/bookings" className="view-all-link">View all</Link></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>User</th><th>Event</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {(data?.recent_bookings||[]).map(b=>(
                <tr key={b.id}>
                  <td>{b.user?.name}</td>
                  <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.event?.title}</td>
                  <td style={{fontWeight:600}}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={b.status}/></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
        <div className="dash-section">
          <div className="ds-header-row"><h2>Recent Users</h2><Link to="/admin/users" className="view-all-link">View all</Link></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Active</th></tr></thead>
            <tbody>
              {(data?.recent_users||[]).map(u=>(
                <tr key={u.id}>
                  <td><div style={{fontWeight:600}}>{u.name}</div><div style={{fontSize:'0.75rem',color:'var(--text-3)'}}>{u.email}</div></td>
                  <td style={{textTransform:'capitalize'}}>{u.role}</td>
                  <td>{u.created_at?format(new Date(u.created_at),'dd MMM yy'):'—'}</td>
                  <td>{u.is_active?'✅':'❌'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  )
}

export function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    adminAPI.users({page,limit:20,q:search||undefined}).then(r=>{setUsers(r.data.users||[]);setTotal(r.data.total||0)}).catch(()=>{}).finally(()=>setLoading(false))
  }
  useEffect(load,[page,search])

  const toggle = async (id) => {
    try { await adminAPI.toggleUser(id); toast.success('User status updated'); load() }
    catch { toast.error('Could not update user') }
  }

  return (
    <div>
      <div className="dash-header"><h1>Manage Users</h1><p>{total} total users</p></div>
      <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24}}>
        <input className="filter-input" style={{maxWidth:320,marginBottom:18}} placeholder="Search users..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} />
        {loading ? <Spinner/> :
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Bookings</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}>
                  <td><div style={{fontWeight:600,color:'var(--navy)'}}>{u.name}</div><div style={{fontSize:'0.75rem',color:'var(--text-3)'}}>{u.email}</div></td>
                  <td><span style={{textTransform:'capitalize',fontSize:'0.82rem',fontWeight:600}}>{u.role}</span></td>
                  <td>{u.created_at?format(new Date(u.created_at),'dd MMM yyyy'):'—'}</td>
                  <td>{u.bookings?.length||0}</td>
                  <td>{u.is_active?'✅':'❌'}</td>
                  <td><Btn variant={u.is_active?'danger':'primary'} size="sm" onClick={()=>toggle(u.id)}>{u.is_active?'Suspend':'Activate'}</Btn></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        }
      </div>
    </div>
  )
}

export function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = ()=>{ setLoading(true); adminAPI.events({limit:50}).then(r=>setEvents(r.data.events||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(load,[])

  const updateStatus = async (id, status) => {
    try { await adminAPI.updateEvent(id,{status}); toast.success(`Event ${status}`); load() }
    catch { toast.error('Could not update event') }
  }

  return (
    <div>
      <div className="dash-header"><h1>Manage Events</h1></div>
      {loading ? <Spinner/> :
        <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24}}>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Event</th><th>Organizer</th><th>Date</th><th>Bookings</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map(e=>(
                <tr key={e.id}>
                  <td><div style={{fontWeight:600,color:'var(--navy)'}}>{e.icon_emoji} {e.title}</div><div style={{fontSize:'0.75rem',color:'var(--text-3)'}}>{e.category}</div></td>
                  <td style={{fontSize:'0.85rem'}}>{e.organizer_name}</td>
                  <td>{e.event_date?format(new Date(e.event_date),'dd MMM yyyy'):'—'}</td>
                  <td>{e.booked_seats}/{e.total_seats}</td>
                  <td><StatusBadge status={e.status}/></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      {e.status==='draft'&&<Btn variant="primary" size="sm" onClick={()=>updateStatus(e.id,'published')}>Publish</Btn>}
                      {e.status==='published'&&<Btn variant="outline" size="sm" onClick={()=>updateStatus(e.id,'suspended')}>Suspend</Btn>}
                      {e.status==='suspended'&&<Btn variant="primary" size="sm" onClick={()=>updateStatus(e.id,'published')}>Restore</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      }
    </div>
  )
}

export function AdminRefunds() {
  const [refunds, setRefunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [note, setNote] = useState('')
  const [processing, setProcessing] = useState(false)

  const load = ()=>{ setLoading(true); adminAPI.refunds().then(r=>setRefunds(r.data||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(load,[])

  const process = async (approve) => {
    setProcessing(true)
    try {
      await adminAPI.processRefund(modal.id,{approved:approve,admin_note:note})
      toast.success(approve?'Refund approved':'Refund rejected')
      setModal(null); setNote(''); load()
    }catch{ toast.error('Could not process refund') }
    finally{ setProcessing(false) }
  }

  return (
    <div>
      <div className="dash-header"><h1>Refund Requests</h1></div>
      {loading?<Spinner/>:
       refunds.length===0?<Empty icon="💸" title="No refund requests"/>:
       <div style={{background:'#fff',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:24}}>
         <div className="tbl-wrap"><table className="tbl">
           <thead><tr><th>Booking</th><th>User</th><th>Amount</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
           <tbody>
             {refunds.map(r=>(
               <tr key={r.id}>
                 <td style={{fontFamily:'monospace',fontSize:'0.8rem'}}>{r.booking?.ticket_id}</td>
                 <td>{r.user?.name}</td>
                 <td style={{fontWeight:600}}>₹{r.amount?.toLocaleString('en-IN')}</td>
                 <td style={{maxWidth:200,fontSize:'0.82rem'}}>{r.reason}</td>
                 <td><StatusBadge status={r.status}/></td>
                 <td>{r.status==='requested'&&<Btn variant="outline" size="sm" onClick={()=>setModal(r)}>Review</Btn>}</td>
               </tr>
             ))}
           </tbody>
         </table></div>
       </div>
      }
      <Modal open={!!modal} onClose={()=>{setModal(null);setNote('')}} title="Process Refund">
        {modal&&<div>
          <p style={{color:'var(--text-2)',marginBottom:8}}>User: <strong>{modal.user?.name}</strong></p>
          <p style={{color:'var(--text-2)',marginBottom:8}}>Amount: <strong>₹{modal.amount?.toLocaleString('en-IN')}</strong></p>
          <p style={{color:'var(--text-2)',marginBottom:16}}>Reason: {modal.reason}</p>
          <div className="field" style={{marginBottom:16}}>
            <label className="field-label">Admin Note (optional)</label>
            <textarea className="field-input field-textarea" style={{minHeight:80}} value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note for the user..." />
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Btn variant="danger" size="md" loading={processing} onClick={()=>process(false)}>Reject</Btn>
            <Btn variant="primary" size="md" loading={processing} onClick={()=>process(true)}>Approve Refund</Btn>
          </div>
        </div>}
      </Modal>
    </div>
  )
}
