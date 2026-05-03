import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usersAPI } from '../../api'
import './Navbar.css'

export default function Navbar() {
  const { user, logout, isAuth, isAdmin, isOrganizer } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const notifRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isAuth()) {
      usersAPI.notifications().then(r => {
        setNotifs(r.data.slice(0, 6))
        setUnread(r.data.filter(n => !n.is_read).length)
      }).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  const markRead = async (id) => {
    await usersAPI.markRead(id).catch(() => {})
    setNotifs(notifs.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const dashLink = isAdmin() ? '/admin' : isOrganizer() ? '/organizer' : '/dashboard'

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">Event<span>Flow</span></Link>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className={location.pathname==='/' ? 'active' : ''}>Home</Link>
          <Link to="/events" className={location.pathname.startsWith('/events') ? 'active' : ''}>Events</Link>
          <Link to="/organizer-info" className={location.pathname==='/organizer-info' ? 'active' : ''}>For Organizers</Link>
          <Link to="/contact" className={location.pathname==='/contact' ? 'active' : ''}>Contact</Link>
        </div>

        <div className="nav-right">
          {isAuth() ? (
            <>
              {/* Notifications */}
              <div className="notif-wrap" ref={notifRef}>
                <button className="notif-btn" onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
                  🔔
                  {unread > 0 && <span className="notif-count">{unread}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <div className="notif-header">
                      <span>Notifications</span>
                      {unread > 0 && (
                        <button onClick={async () => {
                          await usersAPI.markAllRead().catch(()=>{})
                          setNotifs(notifs.map(n=>({...n,is_read:true})))
                          setUnread(0)
                        }} className="notif-clear">Mark all read</button>
                      )}
                    </div>
                    {notifs.length === 0
                      ? <div className="notif-empty">No notifications yet</div>
                      : notifs.map(n => (
                        <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`} onClick={() => markRead(n.id)}>
                          <div className="notif-icon">{n.icon || '🔔'}</div>
                          <div>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-msg">{n.message}</div>
                          </div>
                        </div>
                      ))
                    }
                    <Link to="/dashboard/notifications" className="notif-all">View all →</Link>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="user-menu-wrap" style={{ position:'relative' }}>
                <button className="user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                  <span className="user-name">{user?.name?.split(' ')[0]}</span>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-3)' }}>▾</span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-avatar lg">{user?.name?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{user?.name}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--text-3)' }}>{user?.email}</div>
                      </div>
                    </div>
                    <div className="user-dropdown-divider" />
                    <Link to={dashLink} className="user-dropdown-item">📊 Dashboard</Link>
                    <Link to="/dashboard/bookings" className="user-dropdown-item">🎟 My Bookings</Link>
                    <Link to="/dashboard/wishlist" className="user-dropdown-item">❤️ Wishlist</Link>
                    <Link to="/dashboard/profile" className="user-dropdown-item">👤 Profile</Link>
                    {isOrganizer() && <Link to="/organizer" className="user-dropdown-item">🎪 Organizer Panel</Link>}
                    {isAdmin() && <Link to="/admin" className="user-dropdown-item">👑 Admin Panel</Link>}
                    <div className="user-dropdown-divider" />
                    <button className="user-dropdown-item danger" onClick={handleLogout}>🚪 Log Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
            <span className={menuOpen ? 'open' : ''} />
          </button>
        </div>
      </div>
    </nav>
  )
}
