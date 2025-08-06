import React, { useEffect, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  Container, Table, Spinner, Badge, Button, Pagination
} from 'react-bootstrap';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead
} from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const NotificationListAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // Validasi role admin
  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Admin.',
        icon: 'error',
      }).then(() => navigate('/login/admin'));
      return;
    }

    startInactivityTracker();
    fetchNotifications(currentPage);

    return () => {
      stopInactivityTracker(); // Bersihkan listener saat unmount
    };
  }, [navigate, currentPage]);

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const result = await getNotifications(page, 10);
      setNotifications(result.data || []);
      setCurrentPage(result.current_page || 1);
      setTotalPages(result.last_page || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
    fetchNotifications(currentPage);
  };

  const handleDelete = async (id) => {
    const confirmed = await MySwal.fire({
      title: 'Hapus Notifikasi?',
      text: 'Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirmed.isConfirmed) {
      await deleteNotification(id);
      fetchNotifications(currentPage);
    }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsAsRead();
    fetchNotifications(currentPage);
  };

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

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold mb-0">Daftar Notifikasi</h4>
            <Button variant="outline-primary" size="sm" onClick={handleMarkAll}>
              Tandai Semua Dibaca
            </Button>
          </div>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>No</th>
                <th>Pesan</th>
                <th>Status</th>
                <th>Waktu</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notif, index) => (
                <tr key={notif.id}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  <td>{notif.message}</td>
                  <td>
                    {notif.is_read ? (
                      <Badge bg="secondary">Sudah Dibaca</Badge>
                    ) : (
                      <Badge bg="warning" text="dark">Belum Dibaca</Badge>
                    )}
                  </td>
                  <td>{formatRelativeTime(notif.created_at)}</td>
                  <td className="d-flex gap-2 flex-wrap">
                    {!notif.is_read && (
                      <Button variant="success" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                        Tandai Dibaca
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(notif.id)}>
                      Hapus
                    </Button>
                    {notif.link_to && (
                      <Button variant="info" size="sm" onClick={() => navigate(notif.link_to)}>
                        Lihat
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.Prev
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              />
              {Array.from({ length: totalPages }, (_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={i + 1 === currentPage}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              />
            </Pagination>
          </div>
        </Container>
      </div>
    </>
  );
};

export default NotificationListAdmin;
