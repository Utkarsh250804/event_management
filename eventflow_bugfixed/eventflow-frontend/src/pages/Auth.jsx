import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { Btn, Input } from '../components/ui'
import toast from 'react-hot-toast'
import './Auth.css'

export function Login() {
  const { login } = useAuthStore()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [form, setForm] = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`)
      const redirect = sp.get('redirect')
      if (redirect) { navigate(redirect); return }
      if (user.role === 'admin')     navigate('/admin')
      else if (user.role === 'organizer') navigate('/organizer')
      else navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  const quickLogin = async (email, password, label) => {
    setForm({ email, password })
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success(`Logged in as ${label}`)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'organizer') navigate('/organizer')
      else navigate('/dashboard')
    } catch { toast.error('Demo login failed — run seed.py first') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link to="/" className="auth-logo">Event<span>Flow</span></Link>
        <h2>Welcome<br /><em>back.</em></h2>
        <p>Log in to access your bookings, tickets, and personalized event recommendations.</p>
        <div className="auth-features">
          {[['🎟','Access all your booked tickets instantly'],['📅','Get reminders for upcoming events'],['⚡','One-click checkout on future bookings']].map(([i,t])=>(
            <div key={t} className="auth-feat"><div className="af-icon">{i}</div><span>{t}</span></div>
          ))}
        </div>
        <div className="demo-creds">
          <div className="demo-title">Demo Accounts</div>
          <div className="demo-row">👤 <code>user@eventflow.in / user123</code></div>
          <div className="demo-row">🎪 <code>organizer@eventflow.in / org123</code></div>
          <div className="demo-row">👑 <code>admin@eventflow.in / admin123</code></div>
        </div>
      </div>

      <div className="auth-form-side">
        <Link to="/" className="auth-logo mobile">Event<span>Flow</span></Link>
        <h3>Sign in to your account</h3>
        <p className="auth-sub">Don't have an account? <Link to="/register">Sign up free →</Link></p>

        <form onSubmit={submit} className="auth-form">
          <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
          <div className="pwd-field">
            <Input label="Password" type={showPwd?'text':'password'} placeholder="Your password" value={form.password} onChange={e=>set('password',e.target.value)} required />
            <button type="button" className="pwd-toggle" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁'}</button>
            <Link to="/forgot-password" className="forgot-link">Forgot?</Link>
          </div>
          <Btn type="submit" variant="primary" size="lg" className="btn-full" loading={loading}>Sign In →</Btn>
        </form>

        <div className="auth-divider"><span>Quick demo login</span></div>
        <div className="quick-logins">
          <button onClick={()=>quickLogin('user@eventflow.in','user123','User')} className="ql-btn">👤 User</button>
          <button onClick={()=>quickLogin('organizer@eventflow.in','org123','Organizer')} className="ql-btn">🎪 Organizer</button>
          <button onClick={()=>quickLogin('admin@eventflow.in','admin123','Admin')} className="ql-btn">👑 Admin</button>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const { register } = useAuthStore()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role: sp.get('role')||'user', phone:'' })
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const user = await register({ name:form.name, email:form.email, password:form.password, role:form.role, phone:form.phone||undefined })
      toast.success(`Welcome to EventFlow, ${user.name.split(' ')[0]}! 🎉`)
      if (user.role === 'organizer') navigate('/organizer')
      else navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <Link to="/" className="auth-logo">Event<span>Flow</span></Link>
        <h2>Join the<br /><em>community.</em></h2>
        <p>Create your EventFlow account and start discovering amazing experiences near you.</p>
        <div className="auth-features">
          {[['🎪','Access 12,000+ events across India'],['🎟','Instant e-ticket with QR code'],['📊','Track all your bookings in one dashboard'],['❤️','Save events to your wishlist']].map(([i,t])=>(
            <div key={t} className="auth-feat"><div className="af-icon">{i}</div><span>{t}</span></div>
          ))}
        </div>
      </div>

      <div className="auth-form-side">
        <Link to="/" className="auth-logo mobile">Event<span>Flow</span></Link>
        <h3>Create your account</h3>
        <p className="auth-sub">Already have an account? <Link to="/login">Sign in →</Link></p>

        <form onSubmit={submit} className="auth-form">
          <div className="form-row-2">
            <Input label="Full Name" placeholder="Priya Sharma" value={form.name} onChange={e=>set('name',e.target.value)} required />
            <Input label="Phone (optional)" placeholder="+91 98765 43210" value={form.phone} onChange={e=>set('phone',e.target.value)} />
          </div>
          <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
          <div className="pwd-field">
            <Input label="Password" type={showPwd?'text':'password'} placeholder="Min. 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} required />
            <button type="button" className="pwd-toggle" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁'}</button>
          </div>
          <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} required />

          <div className="role-select">
            <label className="field-label">I want to</label>
            <div className="role-opts">
              <label className={`role-opt ${form.role==='user'?'active':''}`}>
                <input type="radio" name="role" value="user" checked={form.role==='user'} onChange={()=>set('role','user')} style={{display:'none'}} />
                <span>🎫</span> Attend Events
              </label>
              <label className={`role-opt ${form.role==='organizer'?'active':''}`}>
                <input type="radio" name="role" value="organizer" checked={form.role==='organizer'} onChange={()=>set('role','organizer')} style={{display:'none'}} />
                <span>🎪</span> Host Events
              </label>
            </div>
          </div>

          <Btn type="submit" variant="primary" size="lg" className="btn-full" loading={loading}>Create Account →</Btn>
          <p style={{ fontSize:'0.76rem', color:'var(--text-3)', textAlign:'center' }}>By signing up you agree to our Terms of Service and Privacy Policy.</p>
        </form>
      </div>
    </div>
  )
}
