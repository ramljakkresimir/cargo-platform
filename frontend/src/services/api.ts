import axios from 'axios';

// Central axios instance used by all service files
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT token to every outgoing request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If an authenticated request comes back 401, the token is expired/invalid — clear the
// session and send the user to login. Requests with no Authorization header (e.g. the
// login form itself rejecting bad credentials) are left alone so they surface their own error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadAuthHeader = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadAuthHeader) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('sessionExpired', '1');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
