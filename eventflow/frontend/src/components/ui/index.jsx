import React from 'react'

/* ── Button ─────────────────────────────────────────────── */
export function Btn({ variant='primary', size='md', children, className='', loading, disabled, ...props }) {
  const base = `btn btn-${variant} btn-${size} ${className}`
  return (
    <button className={base} disabled={disabled || loading} {...props}>
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

/* ── Input ──────────────────────────────────────────────── */
export function Input({ label, error, icon, className='', ...props }) {
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <div className="field-wrap">
        {icon && <span className="field-icon">{icon}</span>}
        <input className={`field-input ${icon ? 'with-icon' : ''}`} {...props} />
      </div>
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  )
}

/* ── Select ─────────────────────────────────────────────── */
export function Select({ label, error, children, className='', ...props }) {
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <select className="field-input" {...props}>{children}</select>
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  )
}

/* ── Textarea ───────────────────────────────────────────── */
export function Textarea({ label, error, className='', ...props }) {
  return (
    <div className={`field ${error ? 'field-error' : ''} ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <textarea className="field-input field-textarea" {...props} />
      {error && <span className="field-error-msg">{error}</span>}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────── */
export function Badge({ color='gold', children, className='' }) {
  return <span className={`badge badge-${color} ${className}`}>{children}</span>
}

/* ── Spinner ────────────────────────────────────────────── */
export function Spinner({ size=24, color='currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.8s linear infinite', display:'inline-block', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </svg>
  )
}

/* ── Modal ──────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, width=500 }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

/* ── Empty State ────────────────────────────────────────── */
export function Empty({ icon='📭', title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
      {action}
    </div>
  )
}

/* ── Status Badge ───────────────────────────────────────── */
export function StatusBadge({ status }) {
  const map = {
    confirmed:  ['status-confirmed',  'Confirmed'],
    pending:    ['status-pending',    'Pending'],
    cancelled:  ['status-cancelled',  'Cancelled'],
    attended:   ['status-attended',   'Attended'],
    refunded:   ['status-refunded',   'Refunded'],
    published:  ['status-confirmed',  'Published'],
    draft:      ['status-pending',    'Draft'],
    suspended:  ['status-cancelled',  'Suspended'],
    completed:  ['status-attended',   'Completed'],
    approved:   ['status-confirmed',  'Approved'],
    rejected:   ['status-cancelled',  'Rejected'],
    processed:  ['status-attended',   'Processed'],
    requested:  ['status-pending',    'Requested'],
  }
  const [cls, label] = map[status] || ['status-pending', status]
  return <span className={`status-badge ${cls}`}>{label}</span>
}

/* ── Pagination ─────────────────────────────────────────── */
export function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit)
  if (pages <= 1) return null
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(page-1)} disabled={page===1}>←</button>
      {Array.from({length: pages}, (_,i)=>i+1).map(p => (
        <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => onChange(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onChange(page+1)} disabled={page===pages}>→</button>
    </div>
  )
}

/* ── Star Rating ────────────────────────────────────────── */
export function Stars({ rating, max=5 }) {
  return (
    <span className="stars">
      {Array.from({length:max},(_,i) => (
        <span key={i} style={{ color: i < Math.round(rating) ? '#E9A84C' : '#DDD' }}>★</span>
      ))}
    </span>
  )
}
