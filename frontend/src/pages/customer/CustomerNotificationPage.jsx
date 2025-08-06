import React, { useEffect, useState } from 'react';
import { Container, Table, Spinner, Button, Badge, Pagination } from 'react-bootstrap';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead
} from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import AOS from 'aos';
import { useNavigate } from 'react-router-dom';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authhelper'; 

const CustomerNotificationPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    AOS.init({ duration: 600 });

    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning').then(() => {
        navigate('/login');
      });
      return;
    }

    fetchNotifications(currentPage);
  }, [currentPage, navigate]);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const res = await getNotifications(page, 10);
      setNotifications(res.data || []);
      setCurrentPage(res.current_page || 1);
      setTotalPages(res.last_page || 1);
    } catch {
      Swal.fire('Gagal', 'Gagal mengambil notifikasi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    await markNotificationAsRead(id);
    fetchNotifications(currentPage);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus Notifikasi?',
      text: 'Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
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

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container data-aos="fade-up">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="text-white mb-0">Notifikasi Saya</h3>
            {notifications.length > 0 && (
              <Button variant="outline-light" size="sm" onClick={handleMarkAll}>
                Tandai Semua Dibaca
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center text-white"><Spinner animation="border" /></div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-white">Belum ada notifikasi.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded"
                  style={{
                    backgroundColor: notif.is_read ? '#2B2B2B' : '#343A40',
                    borderLeft: notif.is_read ? '5px solid #6c757d' : '5px solid #FFC107',
                    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge bg={notif.is_read ? 'secondary' : 'warning'} text={notif.is_read ? '' : 'dark'}>
                          {notif.is_read ? 'Sudah Dibaca' : 'Belum Dibaca'}
                        </Badge>
                        <small className="text-muted">{formatRelativeTime(notif.created_at)}</small>
                      </div>
                      <div className="text-white">{notif.message}</div>
                    </div>
                    <div className="d-flex gap-2 flex-wrap mt-2 mt-md-0">
                      {!notif.is_read && (
                        <Button variant="outline-success" size="sm" onClick={() => handleMarkAsRead(notif.id)}>
                          Tandai Dibaca
                        </Button>
                      )}
                      {notif.link_to && (
                        <Button variant="outline-info" size="sm" onClick={() => navigate(notif.link_to)}>
                          Lihat
                        </Button>
                      )}
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(notif.id)}>
                        Hapus
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination variant="dark">
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
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default CustomerNotificationPage;
