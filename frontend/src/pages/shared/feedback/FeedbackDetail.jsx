import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Spinner,
  Button,
  Badge,
} from 'react-bootstrap';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const FeedbackDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.get(`/feedback/${id}`);
      setFeedback(res.data);
    } catch (err) {
      console.error('Gagal mengambil detail feedback:', err);
      MySwal.fire({
        title: 'Gagal!',
        text: 'Gagal memuat detail feedback.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

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

    fetchDetail();
  }, [fetchDetail, navigate]);

  const redirectLogout =
    sessionStorage.getItem('role_id') === '1'
      ? '/login/superadmin'
      : '/login/admin';

  if (loading) {
    return (
      <>
        <DashboardSidebar />
        <DashboardNavbar redirectLogout={redirectLogout} />
        <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
          <Container className="text-center py-5">
            <Spinner animation="border" />
          </Container>
        </div>
      </>
    );
  }

  if (!feedback) {
    return (
      <>
        <DashboardSidebar />
        <DashboardNavbar redirectLogout={redirectLogout} />
        <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
          <Container className="text-center py-5">
            <p className="text-muted">Feedback tidak ditemukan.</p>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Kembali
            </Button>
          </Container>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout={redirectLogout} />
      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h4 className="mb-0">Detail Feedback Pengguna</h4>
            </div>

            <p><strong>Pengirim:</strong> {feedback.user?.name || '-'}</p>
            <p><strong>Email:</strong> {feedback.user?.email || '-'}</p>
            <p><strong>Subjek:</strong> {feedback.subject || '-'}</p>

            <p><strong>Pesan:</strong></p>
            <div className="border rounded p-3 bg-light mb-3">{feedback.message}</div>

            <p>
              <strong>Rating:</strong>{' '}
              <Badge bg="warning" text="dark">
                {feedback.rating} ★
              </Badge>
            </p>

            <p><strong>Tanggal Kirim:</strong> {new Date(feedback.created_at).toLocaleString('id-ID')}</p>

            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" onClick={() => navigate(-1)}>
                Kembali
              </Button>
            </div>
        </Container>
      </div>
    </>
  );
};

export default FeedbackDetail;
