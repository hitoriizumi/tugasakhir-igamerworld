import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const logoutUser = async (redirectTo = null) => {
  try {
    await api.post('/logout'); // panggil logout ke backend
  } catch (error) {
    console.error('Logout error:', error.response?.data || error.message);
  }

  // 🔍 Ambil role aktif dari storage
  const activeRole =
    sessionStorage.getItem('active_role') || localStorage.getItem('active_role');

  // 🔐 Bersihkan token & data berdasarkan role
  if (activeRole === '1' || activeRole === 'superadmin') {
    sessionStorage.removeItem('token_1');
  } else if (activeRole === '2' || activeRole === 'admin') {
    sessionStorage.removeItem('token_2');
  } else if (activeRole === '3' || activeRole === 'customer') {
    localStorage.removeItem('token_3');
    localStorage.removeItem('remember_customer');
    localStorage.removeItem('user_id');

    // 🧽 Hapus data rakitan jika ada
    const userId = localStorage.getItem('user_id');
    if (userId) {
      localStorage.removeItem(`custom_pc_step_user_${userId}`);
      localStorage.removeItem(`custom_pc_selected_components_user_${userId}`);
      localStorage.removeItem(`custom_pc_selected_detail_user_${userId}`);
      localStorage.removeItem(`custom_pc_checkout_data_user_${userId}`);
    }
  }

  // 🧹 Hapus info umum yang hanya dipakai untuk tab aktif
  const keysToRemove = ['active_role', 'role_id', 'name'];
  keysToRemove.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });

  // ✅ Alert logout
  await MySwal.fire({
    title: 'Logout Berhasil!',
    text: 'Anda telah keluar dari akun.',
    icon: 'success',
    timer: 2000,
    showConfirmButton: false,
  });

  // 🔁 Redirect sesuai role (jika tidak ditentukan)
  const fallbackRedirect =
    activeRole === '1' || activeRole === 'superadmin'
      ? '/login/superadmin'
      : activeRole === '2' || activeRole === 'admin'
      ? '/login/admin'
      : '/login';

  window.location.href = redirectTo || fallbackRedirect;
};

// Fungsi konfirmasi sebelum logout
const confirmLogout = async (redirectTo = null) => {
  const result = await MySwal.fire({
    title: 'Konfirmasi Logout',
    text: 'Apakah Anda yakin ingin logout?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Logout',
    cancelButtonText: 'Batal',
  });

  if (result.isConfirmed) {
    await logoutUser(redirectTo);
  }
};

export default logoutUser;
export { confirmLogout };
