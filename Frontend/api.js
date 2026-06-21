// SahilCRM API Utility
// Set window.APP_CONFIG.apiBase before loading this file to override in production
const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBase)
  ? window.APP_CONFIG.apiBase.replace(/\/$/, '')
  : 'http://localhost:8080';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
  };
}

async function handleResponse(res, endpoint) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    throw new Error('Session expired');
  }
  if (res.status === 403) throw new Error('Access denied');
  if (res.status === 429) throw new Error('Too many requests. Please wait and try again.');
  if (!res.ok) {
    let msg = 'Request failed: ' + res.status;
    try {
      const body = await res.json();
      msg = body.message || (body.errors ? JSON.stringify(body.errors) : msg);
    } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(API_BASE + endpoint, { headers: getHeaders() });
  return handleResponse(res, endpoint);
}

async function apiPost(endpoint, body) {
  const res = await fetch(API_BASE + endpoint, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return handleResponse(res, endpoint);
}

async function apiPut(endpoint, body) {
  const res = await fetch(API_BASE + endpoint, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });
  return handleResponse(res, endpoint);
}

async function apiDelete(endpoint) {
  const res = await fetch(API_BASE + endpoint, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res, endpoint);
}

function logout() {
  apiPost('/api/auth/logout', {}).catch(() => {});
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function requireAuth(allowedRoles) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return false;
  }
  if (allowedRoles && allowedRoles.length > 0) {
    const user = getCurrentUser();
    if (!user || !allowedRoles.includes(user.role)) {
      window.location.href = '/login.html';
      return false;
    }
  }
  return true;
}

// API namespaces
const Auth = {
  login: (email, password) => apiPost('/api/auth/login', { email, password }),
  logout
};

const Leads = {
  getAll: () => apiGet('/api/leads'),
  getById: (id) => apiGet(`/api/leads/${id}`),
  getByCounselor: (id) => apiGet(`/api/leads/counselor/${id}`),
  getByStage: (stage) => apiGet(`/api/leads/stage/${stage}`),
  create: (lead) => apiPost('/api/leads', lead),
  update: (id, lead) => apiPut(`/api/leads/${id}`, lead),
  delete: (id) => apiDelete(`/api/leads/${id}`)
};

const Users = {
  getAll: () => apiGet('/api/users'),
  getById: (id) => apiGet(`/api/users/${id}`),
  create: (user) => apiPost('/api/users', user),
  update: (id, user) => apiPut(`/api/users/${id}`, user),
  delete: (id) => apiDelete(`/api/users/${id}`)
};

const Courses = {
  getAll: () => apiGet('/api/courses'),
  getActive: () => apiGet('/api/courses/active'),
  getById: (id) => apiGet(`/api/courses/${id}`),
  create: (course) => apiPost('/api/courses', course),
  update: (id, course) => apiPut(`/api/courses/${id}`, course),
  delete: (id) => apiDelete(`/api/courses/${id}`)
};

const FollowUps = {
  getAll: () => apiGet('/api/followups'),
  getByCounselor: (id) => apiGet(`/api/followups/counselor/${id}`),
  getByLead: (id) => apiGet(`/api/followups/lead/${id}`),
  create: (fu) => apiPost('/api/followups', fu),
  update: (id, fu) => apiPut(`/api/followups/${id}`, fu),
  delete: (id) => apiDelete(`/api/followups/${id}`)
};

const CallRecords = {
  getAll: () => apiGet('/api/callrecords'),
  getByLead: (id) => apiGet(`/api/callrecords/lead/${id}`),
  getByCounselor: (id) => apiGet(`/api/callrecords/counselor/${id}`),
  create: (cr) => apiPost('/api/callrecords', cr),
  delete: (id) => apiDelete(`/api/callrecords/${id}`)
};

const Admissions = {
  getAll: () => apiGet('/api/admissions'),
  getById: (id) => apiGet(`/api/admissions/${id}`),
  getByLead: (id) => apiGet(`/api/admissions/lead/${id}`),
  create: (a) => apiPost('/api/admissions', a),
  update: (id, a) => apiPut(`/api/admissions/${id}`, a),
  delete: (id) => apiDelete(`/api/admissions/${id}`)
};

// Shared call handler: mobile dials directly, desktop shows a popup with name+number
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function initiateCall(name, phone) {
  if (!phone) { if (window.showToast) showToast('No phone number available', 'error'); return; }
  if (isMobileDevice()) {
    location.href = 'tel:' + phone;
    return;
  }
  let modal = document.getElementById('callInfoModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'callInfoModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:999;';
    modal.innerHTML = `
      <div style="background:var(--bg2,#171b26);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:14px;padding:24px;width:320px;text-align:center;font-family:'DM Sans',sans-serif;">
        <div style="font-size:13px;color:var(--muted,#7a8099);margin-bottom:6px;">Call this number manually</div>
        <div id="callInfoName" style="font-size:16px;font-weight:600;color:var(--text,#e8eaf0);margin-bottom:4px;"></div>
        <div id="callInfoPhone" style="font-size:20px;font-weight:700;color:var(--accent,#4f8ef7);margin-bottom:18px;letter-spacing:.5px;"></div>
        <button onclick="document.getElementById('callInfoModal').remove()" style="padding:8px 20px;border-radius:8px;border:1px solid var(--border,rgba(255,255,255,.12));background:transparent;color:var(--text,#e8eaf0);cursor:pointer;font-size:13px;">Close</button>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('callInfoName').textContent = name || 'Lead';
  document.getElementById('callInfoPhone').textContent = phone;
  modal.style.display = 'flex';
}
