// 🔐 Cek apakah role saat ini customer
export const isCustomer = () => {
  return (
    localStorage.getItem('token_3') &&
    localStorage.getItem('role_id') === '3'
  );
};

// 🔐 Cek apakah role saat ini admin
export const isAdmin = () => {
  return (
    sessionStorage.getItem('token_2') &&
    sessionStorage.getItem('role_id') === '2'
  );
};

// 🔐 Cek apakah role saat ini superadmin
export const isSuperadmin = () => {
  return (
    sessionStorage.getItem('token_1') &&
    sessionStorage.getItem('role_id') === '1'
  );
};

// 📥 Simpan data login sesuai role
export const saveAuthData = (role, token, userData = {}) => {
  const roleStr = role.toString();

  switch (roleStr) {
    case '1':
    case 'superadmin':
      sessionStorage.setItem('token_1', token);
      sessionStorage.setItem('role_id', '1');
      sessionStorage.setItem('active_role', 'superadmin');
      sessionStorage.setItem('name', userData.name || '');
      break;
    case '2':
    case 'admin':
      sessionStorage.setItem('token_2', token);
      sessionStorage.setItem('role_id', '2');
      sessionStorage.setItem('active_role', 'admin');
      sessionStorage.setItem('name', userData.name || '');
      break;
    case '3':
    case 'customer':
      localStorage.setItem('token_3', token);
      localStorage.setItem('role_id', '3');
      localStorage.setItem('active_role', 'customer');
      localStorage.setItem('name', userData.name || '');
      if (userData.id) {
        localStorage.setItem('user_id', userData.id); // untuk data rakitan
      }
      break;
    default:
      console.warn('[authHelper] Role tidak dikenal:', role);
  }
};

// 🧹 Bersihkan data login sesuai role
export const clearAuthData = (role) => {
  const roleStr = role.toString();

  switch (roleStr) {
    case '1':
    case 'superadmin':
      sessionStorage.removeItem('token_1');
      break;
    case '2':
    case 'admin':
      sessionStorage.removeItem('token_2');
      break;
    case '3':
    case 'customer':
      localStorage.removeItem('token_3');
      localStorage.removeItem('remember_customer');
      localStorage.removeItem('user_id');
      break;
    default:
      break;
  }

  // Hapus info umum
  ['role_id', 'active_role', 'name'].forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};
