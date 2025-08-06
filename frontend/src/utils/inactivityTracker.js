import logoutUser from './logout';

let logoutTimeout;
const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 menit

// Cek apakah role saat ini adalah admin atau superadmin
const isSensitiveRole = () => {
  const role =
    sessionStorage.getItem('active_role') || localStorage.getItem('active_role');
  return role === 'admin' || role === '2' || role === 'superadmin' || role === '1';
};

const resetTimer = () => {
  clearTimeout(logoutTimeout);
  logoutTimeout = setTimeout(() => {
    console.warn('[InactivityTracker] Tidak ada aktivitas, logout otomatis...');
    logoutUser(); // ⏳ Logout otomatis
  }, IDLE_TIMEOUT);
};

const startInactivityTracker = () => {
  if (!isSensitiveRole()) return; // ⛔ Tidak aktif jika bukan admin/superadmin

  // Hindari duplikat listener
  stopInactivityTracker();
  resetTimer();

  window.addEventListener('mousemove', resetTimer);
  window.addEventListener('mousedown', resetTimer);
  window.addEventListener('keydown', resetTimer);
  window.addEventListener('scroll', resetTimer);
};

const stopInactivityTracker = () => {
  clearTimeout(logoutTimeout);
  window.removeEventListener('mousemove', resetTimer);
  window.removeEventListener('mousedown', resetTimer);
  window.removeEventListener('keydown', resetTimer);
  window.removeEventListener('scroll', resetTimer);
};

export { startInactivityTracker, stopInactivityTracker };
