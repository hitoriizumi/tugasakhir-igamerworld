import axios from 'axios';

// Ambil token CSRF dari cookie
const getXsrfTokenFromCookie = () => {
  const match = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
};

// Axios khusus untuk auth & csrf-cookie
const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Auto-inject X-XSRF-TOKEN jika tersedia di cookie
axiosInstance.interceptors.request.use((config) => {
  const xsrfToken = getXsrfTokenFromCookie();
  if (xsrfToken) {
    config.headers['X-XSRF-TOKEN'] = xsrfToken;
  }
  return config;
}, (error) => Promise.reject(error));

export default axiosInstance;
