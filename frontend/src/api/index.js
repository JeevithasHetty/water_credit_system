import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('aq_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export const authAPI = {
  signup: d => api.post('/auth/signup', d),
  login:  d => api.post('/auth/login', d),
  me:     () => api.get('/auth/me'),
};

export const listingsAPI = {
  getAll: p  => api.get('/listings', { params: p }),
  getMy:  () => api.get('/listings/my'),
  create: d  => api.post('/listings', d),
  delete: id => api.delete(`/listings/${id}`),
};

export const ordersAPI = {
  checkout:   d  => api.post('/orders', d),
  getBuyer:   () => api.get('/orders/buyer'),
  getSeller:  () => api.get('/orders/seller'),
};

export const transporterAPI = {
  setAvail:     a        => api.put('/transporter/availability', { availability: a }),
  getOrders:    ()       => api.get('/transporter/orders'),
  updateStatus: (id, s)  => api.put(`/transporter/orders/${id}/status`, { status: s }),
  updateLoc:    (lat,lng)=> api.put('/transporter/location', { lat, lng }),
};

export const adminAPI = {
  getTransporters:  () => api.get('/admin/transporters'),
  getVerifications: () => api.get('/admin/verifications'),
  makeDecision: (id, d) => api.post(`/admin/transporters/${id}/decision`, d),
  getAllOrders:      () => api.get('/admin/orders'),
  getStats:         () => api.get('/admin/stats'),
};

export default api;
