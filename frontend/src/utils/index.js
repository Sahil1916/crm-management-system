// ── Date Utilities ────────────────────────────────────────────────────────────
export const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      ...options,
    });
  } catch { return dateStr; }
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
};

export const today = () => new Date().toISOString().split('T')[0];

export const relativeTime = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDate(dateStr);
};

// ── Currency ──────────────────────────────────────────────────────────────────
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ── CSV Export ────────────────────────────────────────────────────────────────
export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  const keys    = Object.keys(data[0]);
  const header  = keys.join(',');
  const rows    = data.map(row =>
    keys.map(k => {
      const val = row[k] ?? '';
      return typeof val === 'string' && val.includes(',')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  const csv     = [header, ...rows].join('\n');
  const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const link    = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ── Error Handling ────────────────────────────────────────────────────────────
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';
  if (error.response?.data?.message)   return error.response.data.message;
  if (error.response?.data?.details)   return Object.values(error.response.data.details).join(', ');
  if (error.message)                   return error.message;
  return 'An unexpected error occurred';
};

// ── Validation Helpers ────────────────────────────────────────────────────────
export const validators = {
  required:  (v)    => !v || !String(v).trim() ? 'This field is required' : null,
  email:     (v)    => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Invalid email' : null,
  phone:     (v)    => v && !/^[6-9]\d{9}$/.test(v) ? 'Invalid Indian mobile number' : null,
  minLength: (n)    => (v) => v && v.length < n ? `Minimum ${n} characters` : null,
  maxLength: (n)    => (v) => v && v.length > n ? `Maximum ${n} characters` : null,
  positive:  (v)    => v && Number(v) <= 0 ? 'Must be a positive number' : null,
};

export const validate = (form, rules) => {
  const errors = {};
  Object.entries(rules).forEach(([field, fieldRules]) => {
    for (const rule of fieldRules) {
      const error = rule(form[field]);
      if (error) { errors[field] = error; break; }
    }
  });
  return { errors, isValid: Object.keys(errors).length === 0 };
};

// ── String Helpers ────────────────────────────────────────────────────────────
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

export const truncate = (str, max = 50) =>
  str && str.length > max ? str.slice(0, max) + '…' : (str || '');

export const statusLabel = (status) => {
  const map = {
    NEW: 'New', IN_CONTACT: 'In Contact',
    CONVERTED: 'Converted', DROPPED: 'Dropped',
    HOT: 'Hot', WARM: 'Warm', COLD: 'Cold',
    PAID: 'Paid', PARTIAL: 'Partial', PENDING: 'Pending',
  };
  return map[status] || capitalize(status);
};

// ── Local Storage Helpers ─────────────────────────────────────────────────────
export const storage = {
  get:    (key)        => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set:    (key, value) => { localStorage.setItem(key, JSON.stringify(value)); },
  remove: (key)        => { localStorage.removeItem(key); },
  clear:  ()           => { localStorage.clear(); },
};
