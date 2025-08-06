import React, { useEffect, useState, useCallback } from 'react';
import { Container, Table, Spinner, Badge, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await api.get('/feedback');
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil data feedback:', err);
      MySwal.fire({
        title: 'Gagal!',
        text: 'Gagal memuat feedback.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token_admin');
    const role = sessionStorage.getItem('role_id');

    if (!token) {
      MySwal.fire({
        title: 'Tidak Terautentikasi!',
        text: 'Silakan login terlebih dahulu.',
        icon: 'warning',
      }).then(() => {
        navigate('/login/admin');
      });
      return;
    }

    if (role !== '1' && role !== '2') {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Admin dan Superadmin.',
        icon: 'error',
      }).then(() => {
        navigate('/');
      });
      return;
    }

    fetchFeedback();
  }, [fetchFeedback, navigate]);

  const redirectLogout =
    sessionStorage.getItem('role_id') === '1'
      ? '/login/superadmin'
      : '/login/admin';

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout={redirectLogout} />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h4 className="mb-0">Daftar Feedback Pengguna</h4>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" />
              </div>
            ) : feedbacks.length === 0 ? (
              <p className="text-muted">Belum ada feedback dari pengguna.</p>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover responsive>
                  <thead className="text-center">
                    <tr>
                      <th>#</th>
                      <th>Pengirim</th>
                      <th>Email</th>
                      <th>Rating</th>
                      <th>Tanggal</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((fb, i) => (
                      <tr key={fb.id} className="text-center align-middle">
                        <td>{i + 1}</td>
                        <td>{fb.user?.name || '-'}</td>
                        <td>{fb.user?.email || '-'}</td>
                        <td>
                          <Badge bg="warning" text="dark">
                            {fb.rating} ★
                          </Badge>
                        </td>
                        <td>{new Date(fb.created_at).toLocaleDateString('id-ID')}</td>
                        <td>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/feedback/${fb.id}`)}
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
        </Container>
      </div>
    </>
  );
};

export default FeedbackList;
