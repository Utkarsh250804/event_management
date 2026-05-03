import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ef_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ef_token')
      localStorage.removeItem('ef_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login:    (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  me:       ()  => api.get('/auth/me'),
  logout:   ()  => api.post('/auth/logout'),
}

// ── Events ────────────────────────────────────────────────
export const eventsAPI = {
  list:       (params) => api.get('/events', { params }),
  featured:   (limit=6) => api.get('/events/featured', { params: { limit } }),
  trending:   (limit=6) => api.get('/events/trending', { params: { limit } }),
  categories: () => api.get('/events/categories'),
  cities:     () => api.get('/events/cities'),
  byId:       (id) => api.get(`/events/${id}`),
  bySlug:     (slug) => api.get(`/events/slug/${slug}`),
  reviews:    (id) => api.get(`/events/${id}/reviews`),
  addReview:  (id, d) => api.post(`/events/${id}/reviews`, d),
  wishlist:   (id) => api.post(`/events/${id}/wishlist`),
  trackView:  (id) => api.post(`/events/${id}/view`).catch(()=>{}),
  // Organizer
  create:     (d) => api.post('/events', d),
  update:     (id, d) => api.put(`/events/${id}`, d),
  delete:     (id) => api.delete(`/events/${id}`),
  publish:    (id) => api.post(`/events/${id}/publish`),
  attendees:  (id, p) => api.get(`/events/${id}/attendees`, { params: p }),
  checkin:    (id, tid) => api.post(`/events/${id}/checkin/${tid}`),
  analytics:  (id) => api.get(`/events/${id}/analytics`),
}

// ── Bookings ──────────────────────────────────────────────
export const bookingsAPI = {
  create:          (d) => api.post('/bookings', d),
  my:              () => api.get('/bookings/my'),
  byId:            (id) => api.get(`/bookings/${id}`),
  cancel:          (id) => api.post(`/bookings/${id}/cancel`),
  refund:          (id, d) => api.post(`/bookings/${id}/refund`, d),
  ticket:          (id) => api.get(`/bookings/${id}/ticket`),
  validateCoupon:  (code, event_id, amount) => api.post('/bookings/coupon/validate', { code, event_id, amount }),
}

// ── Users ─────────────────────────────────────────────────
export const usersAPI = {
  updateProfile:  (d) => api.put('/users/profile', d),
  changePassword: (d) => api.post('/users/change-password', d),
  myWishlist:     () => api.get('/users/wishlist'),
  myReviews:      () => api.get('/users/reviews'),
  notifications:  () => api.get('/users/notifications'),
  markRead:       (id) => api.put(`/users/notifications/${id}/read`),
  markAllRead:    () => api.post('/users/notifications/read-all'),
  deleteAccount:  () => api.delete('/users/me'),
}

// ── Organizer ─────────────────────────────────────────────
export const organizerAPI = {
  dashboard:      () => api.get('/organizer/dashboard'),
  events:         (p) => api.get('/organizer/events', { params: p }),
  getProfile:     () => api.get('/organizer/profile'),
  updateProfile:  (d) => api.put('/organizer/profile', d),
  bookings:       (eid, p) => api.get(`/organizer/events/${eid}/bookings`, { params: p }),
  analytics:      (eid) => api.get(`/organizer/events/${eid}/analytics`),
  createCoupon:   (d) => api.post('/organizer/coupons', d),
  coupons:        () => api.get('/organizer/coupons'),
  deleteCoupon:   (id) => api.delete(`/organizer/coupons/${id}`),
  revenue:        () => api.get('/organizer/revenue'),
}

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  dashboard:     () => api.get('/admin/dashboard'),
  users:         (p) => api.get('/admin/users', { params: p }),
  updateUser:    (id, d) => api.put(`/admin/users/${id}/role`, {}, { params: { role: d.role } }),
  toggleUser:    (id) => api.post(`/admin/users/${id}/toggle`),
  events:        (p) => api.get('/admin/events', { params: p }),
  // updateEvent: sends PUT /admin/events/{id} with body {status, is_featured, ...}
  updateEvent:   (id, d) => api.put(`/admin/events/${id}`, d),
  bookings:      (p) => api.get('/admin/bookings', { params: p }),
  refunds:       (p) => api.get('/admin/refunds', { params: p }),
  // processRefund: POST /admin/refunds/{id}/process
  processRefund: (id, d) => api.post(`/admin/refunds/${id}/process`, d),
  contacts:      (p) => api.get('/admin/contacts', { params: p }),
  newsletter:    () => api.get('/admin/newsletter'),
  coupons:       () => api.get('/admin/coupons'),
}

// ── Contact ───────────────────────────────────────────────
export const contactAPI = {
  send:      (d) => api.post('/contact', d),
  subscribe: (d) => api.post('/contact/newsletter', d),
}

// ── Coupons (public validate) ─────────────────────────────
export const couponsAPI = {
  validate: (code, event_id, amount) => api.post('/bookings/coupon/validate', { code, event_id, amount }),
}

export default api
