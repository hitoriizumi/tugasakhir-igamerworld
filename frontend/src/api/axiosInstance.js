import axios from 'axios';

// 🔐 Helper: Ambil token berdasarkan role yang aktif di tab saat ini
const getActiveToken = () => {
  const token3 = localStorage.getItem('token_3');
  const roleId = localStorage.getItem('role_id');

  if (!sessionStorage.getItem('active_role') && token3 && roleId === '3') {
    return token3; // fallback agar customer tetap dianggap login
  }

  const rawRole = sessionStorage.getItem('active_role') || localStorage.getItem('active_role');
  const role = rawRole?.toString().toLowerCase();

  switch (role) {
    case 'superadmin':
    case '1':
      return sessionStorage.getItem('token_1');
    case 'admin':
    case '2':
      return sessionStorage.getItem('token_2');
    case 'customer':
    case '3':
      return localStorage.getItem('token_3');
    default:
      console.warn('[axiosInstance] Role tidak valid atau belum login.');
      return null;
  }
};

// 🔒 Ambil token CSRF dari cookie
const getCsrfToken = () => {
  try {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    return token ? decodeURIComponent(token) : null;
  } catch {
    return null;
  }
};

// 🛠️ Buat instance utama
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// ✅ Inject token & CSRF ke setiap request
api.interceptors.request.use((config) => {
  const token = getActiveToken();
  const csrf = getCsrfToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (csrf) {
    config.headers['X-XSRF-TOKEN'] = csrf;
  }

  return config;
}, (error) => Promise.reject(error));

// 🚨 Tangani error autentikasi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      console.warn('[axiosInstance] Autentikasi gagal atau akses ditolak.');
      // Tidak auto-redirect atau clear storage agar tidak bentrok antar role
    }
    return Promise.reject(error);
  }
);

export default api;

// 📥 Ambil daftar notifikasi (dengan pagination)
export const getNotifications = async (page = 1, perPage = 10) => {
  try {
    const response = await api.get('/notifications', {
      params: { page, per_page: perPage },
    });
    return response.data; // objek: { data, current_page, last_page, total, ... }
  } catch (error) {
    console.error('Gagal mengambil notifikasi:', error);
    return {
      data: [],
      current_page: 1,
      total: 0,
      last_page: 1,
    };
  }
};

// 📥 (Opsional) Versi khusus untuk navbar, return langsung array
export const getAllNotificationsFlat = async () => {
  try {
    const response = await api.get('/notifications', {
      params: { per_page: 100 }, // ambil banyak sekalian
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Gagal mengambil notifikasi navbar:', error);
    return [];
  }
};

// ✅ Tandai sebagai sudah dibaca
export const markNotificationAsRead = async (id) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  } catch (error) {
    console.error('Gagal menandai notifikasi sebagai dibaca:', error);
  }
};

// 🗑️ Hapus notifikasi
export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Gagal menghapus notifikasi:', error);
  }
};

// 📌 Tandai semua notifikasi sebagai dibaca
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Gagal menandai semua notifikasi sebagai dibaca:', error);
  }
};

// 🔢 Ambil jumlah notifikasi belum dibaca
export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get('/notifications/unread-count');
    return response.data.unread || 0;
  } catch (error) {
    console.error('Gagal mengambil jumlah notifikasi belum dibaca:', error);
    return 0;
  }
};

