import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Helpers ────────────────────────────────────────────────────────────────
export function unwrapList(response) {
  const body = response?.data;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.content)) return body.data.content;
  if (Array.isArray(body)) return body;
  return [];
}

export function unwrapPaged(response) {
  const body = response?.data;
  const paged = body?.data ?? body ?? {};
  return {
    content: Array.isArray(paged.content) ? paged.content : [],
    totalPages: paged.totalPages ?? 0,
    totalElements: paged.totalElements ?? 0,
    page: paged.page ?? 0,
    size: paged.size ?? 20,
  };
}

export function unwrapObject(response) {
  return response?.data?.data ?? response?.data ?? null;
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (role) => api.get('/users', { params: role ? { role } : {} }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ── Enquiries ──────────────────────────────────────────────────────────────
export const enquiriesAPI = {
  getAll: (params) => api.get('/enquiries', { params }),
  getById: (id) => api.get(`/enquiries/${id}`),
  create: (data) => api.post('/enquiries', data),
  updateStatus: (id, status) => api.patch(`/enquiries/${id}/status`, { status }),
  assign: (id, counsellorId) => api.patch(`/enquiries/${id}/assign`, { counsellorId }),
  stats: () => api.get('/enquiries/stats'),
  myStats: () => api.get('/enquiries/my-stats'),
};

// ── Admissions ─────────────────────────────────────────────────────────────
export const admissionsAPI = {
  // Role-scoped list of existing admission records
  getAll: (params) => api.get('/admissions', { params }),

  // NEW: get all CONVERTED enquiries (with admission status)
  // Used by the Admission Page to show the flow
  getConvertedLeads: () => api.get('/admissions/converted-leads'),

  // Create a new admission from a converted enquiry
  create: (data) => api.post('/admissions', data),

  // Update payment amount
  updatePayment: (id, feePaid) =>
    api.patch(`/admissions/${id}/payment`, { feePaid: String(feePaid) }),

  // Assign trainer
  assignTrainer: (id, trainerId) =>
    api.patch(`/admissions/${id}/assign-trainer`, { trainerId }),
};

// ── Call Records ───────────────────────────────────────────────────────────
export const callsAPI = {
  getByEnquiry: (enquiryId) => api.get(`/enquiries/${enquiryId}/calls`),
  create: (enquiryId, data) => api.post(`/enquiries/${enquiryId}/calls`, data),
};

// ── Follow-ups ─────────────────────────────────────────────────────────────
export const followUpsAPI = {
  getByEnquiry: (enquiryId) => api.get(`/enquiries/${enquiryId}/followups`),
  create: (enquiryId, data) => api.post(`/enquiries/${enquiryId}/followups`, data),
  complete: (enquiryId, id) => api.patch(`/enquiries/${enquiryId}/followups/${id}/complete`),
};

// ── Courses ────────────────────────────────────────────────────────────────
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

// ── Attendance ─────────────────────────────────────────────────────────────
export const attendanceAPI = {
  get: (trainerId, date) => api.get('/attendance', { params: { trainerId, date } }),
  markBulk: (data) => api.post('/attendance/bulk', data),
  getSummary: (studentId) => api.get(`/attendance/student/${studentId}/summary`),
};

// ── Notifications ──────────────────────────────────────────────────────────
export const notificationsAPI = {
  getUnread: () => api.get('/notifications/unread'),
  countUnread: () => api.get('/notifications/unread/count'),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
};

// ── Reports ────────────────────────────────────────────────────────────────
export const reportsAPI = {
  admissions: (params) => api.get('/reports/admissions', { params }),
  counsellorPerformance: () => api.get('/reports/counsellor-performance'),
  leadConversion: () => api.get('/reports/lead-conversion'),
};

export default api;