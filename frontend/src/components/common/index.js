import React from 'react';

// ── Badge ─────────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  NEW: 'badge-blue',
  IN_CONTACT: 'badge-amber',
  CONVERTED: 'badge-green',
  DROPPED: 'badge-red',
  HOT: 'badge-red',
  WARM: 'badge-amber',
  COLD: 'badge-blue',
  PAID: 'badge-green',
  PARTIAL: 'badge-amber',
  PENDING: 'badge-gray',
  PRESENT: 'badge-green',
  ABSENT: 'badge-red',
  LATE: 'badge-amber',
  ADMIN: 'badge-purple',
  COUNSELLOR: 'badge-teal',
  TRAINER: 'badge-blue',
  STUDENT: 'badge-gray',
};

const STATUS_LABEL = {
  NEW: 'New', IN_CONTACT: 'In Contact', CONVERTED: 'Converted', DROPPED: 'Dropped',
  HOT: 'Hot', WARM: 'Warm', COLD: 'Cold',
  PAID: 'Paid', PARTIAL: 'Partial', PENDING: 'Pending',
  PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late',
  ADMIN: 'Admin', COUNSELLOR: 'Counsellor', TRAINER: 'Trainer', STUDENT: 'Student',
  UNDERGRADUATE: 'UG', POSTGRADUATE: 'PG', DIPLOMA: 'Diploma',
};

export function Badge({ value, label, className = '' }) {
  const cls = STATUS_MAP[value] || 'badge-gray';
  return (
    <span className={`badge ${cls} ${className}`}>
      {label || STATUS_LABEL[value] || value}
    </span>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`spin ${className}`}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  if (!open) return null;
  const maxWidths = { sm: '400px', md: '520px', lg: '700px', xl: '900px' };
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: maxWidths[size] }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
const TOAST_ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
const TOAST_CLS = { success: 'alert-success', error: 'alert-error', warning: 'alert-warning', info: 'alert-info' };

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`alert ${TOAST_CLS[t.type] || TOAST_CLS.info}`}
          style={{ minWidth: 260, boxShadow: 'var(--shadow-md)', animation: 'slideUp .2s ease', cursor: 'pointer' }}
          onClick={() => onRemove(t.id)}
        >
          <span>{TOAST_ICONS[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title = 'Nothing here', text = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {text && <p className="empty-state-text">{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <button
        className="pag-btn" disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >← Prev</button>
      {start > 0 && <><button className="pag-btn" onClick={() => onPageChange(0)}>1</button><span style={{ color: 'var(--color-text-muted)', padding: '0 2px' }}>…</span></>}
      {pages.map(p => (
        <button key={p} className={`pag-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>
          {p + 1}
        </button>
      ))}
      {end < totalPages - 1 && <><span style={{ color: 'var(--color-text-muted)', padding: '0 2px' }}>…</span><button className="pag-btn" onClick={() => onPageChange(totalPages - 1)}>{totalPages}</button></>}
      <button
        className="pag-btn" disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >Next →</button>
      <span className="text-muted text-sm" style={{ marginLeft: 6 }}>
        Page {page + 1} of {totalPages}
      </span>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, delta, deltaType = 'neutral', icon, accentColor }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="stat-label">{label}</span>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      </div>
      <div className="stat-value" style={accentColor ? { color: accentColor } : {}}>{value}</div>
      {delta && <div className={`stat-delta ${deltaType}`}>{delta}</div>}
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  return (
    <Modal
      open={open}
      title={title || 'Confirm Action'}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>{message}</p>
    </Modal>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, error, hint, required, children }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      {children}
      {hint && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-4" style={{ flexWrap: 'wrap', gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.4px' }}>{title}</h1>
        {subtitle && <p className="text-muted text-sm" style={{ marginTop: 2 }}>{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── SortableHeader ────────────────────────────────────────────────────────────
export function SortableHeader({ label, field, sortField, sortDir, onSort }) {
  const isActive = sortField === field;
  return (
    <th
      className={isActive ? 'sorted' : ''}
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer' }}
    >
      {label} {isActive ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
}

// ── SearchInput ───────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--border-radius)',
      padding: '6px 10px',
      minWidth: 220,
    }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}>
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        className="form-control"
        style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', minWidth: 160 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
