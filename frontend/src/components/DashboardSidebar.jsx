import React, { useEffect, useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Monitor,
  FileText,
  MessageSquare,
  Users,
  Home,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { isAdmin, isSuperadmin } from '@/utils/authHelper';

const DashboardSidebar = () => {
  const [roleId, setRoleId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Validasi role yang boleh mengakses komponen ini
  useEffect(() => {
    if (!isAdmin() && !isSuperadmin()) {
      const lastRole = sessionStorage.getItem('active_role');
      const target = lastRole === 'superadmin' ? '/login/superadmin' : '/login/admin';

      Swal.fire('Akses Ditolak', 'Silakan login sebagai admin atau superadmin.', 'warning')
        .then(() => navigate(target));
    }

    // const role = sessionStorage.getItem('role_id') || localStorage.getItem('role_id');
    const role = sessionStorage.getItem('role_id');
    setRoleId(role);
  }, [navigate]);

  const menus = {
    '1': [ // Superadmin
      { icon: <Home size={24} />, label: 'Dashboard', path: '/superadmin/dashboard' },
      { icon: <Users size={24} />, label: 'Kelola Admin', path: '/superadmin/dashboard/manage-admin' },
      { icon: <Monitor size={24} />, label: 'Lihat Pelanggan', path: '/superadmin/orders/product' },
      { icon: <MessageSquare size={24} />, label: 'Feedback', path: '/superadmin/feedbacks' },
    ],
    '2': [ // Admin
      { icon: <Home size={24} />, label: 'Dashboard', path: '/admin/dashboard' },
      { icon: <FileText size={24} />, label: 'Manajemen Produk', path: '/admin/products' },
      { icon: <Monitor size={24} />, label: 'Pesanan', path: '/admin/orders/product' },
      { icon: <MessageSquare size={24} />, label: 'Feedback', path: '/admin/feedbacks' },
    ],
  };

  const currentMenus = menus[roleId] || [];

  return (
    <div
      className="d-none d-md-block bg-light border-end"
      style={{
        width: '80px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1030,
      }}
    >
      <Nav className="flex-column align-items-center py-4" style={{ height: '100%' }}>
        {currentMenus.map((menu, i) => (
          <Link
            key={i}
            to={menu.path}
            className={`mb-4 d-flex justify-content-center align-items-center text-dark ${
              location.pathname === menu.path ? 'fw-bold' : ''
            }`}
            title={menu.label}
            aria-label={menu.label}
          >
            {menu.icon}
          </Link>
        ))}
      </Nav>
    </div>
  );
};

export default DashboardSidebar;
