import React, { useEffect, useState } from 'react';
import {
  Navbar, Container, Nav, Button, Dropdown, Badge, Spinner
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
// import logoutUser from '@/utils/logout';
import { confirmLogout } from '@/utils/logout';
import { Bell } from 'lucide-react';
import { getAllNotificationsFlat } from '@/api/axiosInstance';
import { isAdmin, isSuperadmin } from '@/utils/authHelper';
import Swal from 'sweetalert2';

const DashboardNavbar = ({ redirectLogout }) => {
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const navigate = useNavigate();

  // ✅ Validasi role login
  useEffect(() => {
    if (!isAdmin() && !isSuperadmin()) {
      const lastRole = sessionStorage.getItem('active_role');
      const target = lastRole === 'superadmin' ? '/login/superadmin' : '/login/admin';

      Swal.fire('Akses Ditolak', 'Silakan login sebagai admin atau superadmin.', 'warning')
        .then(() => navigate(target));
    }
  }, [navigate]);

  // Ambil nama dan role_id dari session
  useEffect(() => {
    const storedName = sessionStorage.getItem('name');
    const storedRole = sessionStorage.getItem('role_id');
    setName(storedName || '');
    setRoleId(storedRole || null);
  }, []);

  // Ambil notifikasi khusus admin
  useEffect(() => {
    if (!isAdmin()) return;

    const fetchNotifications = async () => {
      try {
        const notifList = await getAllNotificationsFlat();
        const topFive = notifList.slice(0, 5);
        setNotifications(topFive);
        setUnreadCount(notifList.filter(n => !n.is_read).length);
      } catch (err) {
        console.error('Gagal ambil notifikasi navbar:', err);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoadingNotif(false);
      }
    };

    fetchNotifications();
  }, []);

  const profileLink =
    roleId === '1' ? '/superadmin/profile' :
    roleId === '2' ? '/admin/profile' : '#';

  const formatRelativeTime = (timestamp) => {
    const created = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - created) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 172800) return 'Kemarin';
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  return (
    <Navbar
      bg="light"
      expand="lg"
      fixed="top"
      className="shadow-sm ps-md-5 ps-3"
      style={{ marginLeft: '80px', height: '60px' }}
    >
      <Container fluid className="px-3">
        <Navbar.Brand as={Link} to="/" className="fw-bold text-dark">
          iGamerWorld
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="dashboard-navbar" />
        <Navbar.Collapse id="dashboard-navbar" className="justify-content-end align-items-center">
          <Nav className="gap-3 align-items-center">
            <Nav.Link as={Link} to={profileLink} className="text-dark">
              Profil Saya
            </Nav.Link>

            <span className="fw-semibold text-dark d-none d-md-inline">
              Hai, {name || 'Admin'}
            </span>

            {roleId === '2' && (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="light"
                  className="position-relative border-0 bg-transparent shadow-none"
                  id="dropdown-notification"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                      {unreadCount}
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                  <div className="fw-bold px-3 pt-2 pb-1 border-bottom">Notifikasi Terbaru</div>

                  {loadingNotif ? (
                    <div className="text-center py-3">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-3 text-muted">Tidak ada notifikasi</div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="px-3 py-2 text-wrap"
                        style={{
                          backgroundColor: notif.is_read ? 'white' : '#f8f9fa',
                          borderBottom: '1px solid #eee',
                          fontSize: '0.88rem'
                        }}
                      >
                        <div className={`mb-1 ${!notif.is_read ? 'fw-bold' : ''}`} style={{ color: '#333' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#999' }}>
                          {formatRelativeTime(notif.created_at)}
                        </div>
                      </div>
                    ))
                  )}

                  <div className="border-top">
                    <Link to="/admin/notifications" className="d-block text-center py-2 fw-semibold text-primary">
                      Lihat Semua Notifikasi
                    </Link>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            )}

            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => confirmLogout(redirectLogout)}
            >
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default DashboardNavbar;
