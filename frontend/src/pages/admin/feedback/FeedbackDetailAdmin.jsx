import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Container, Spinner, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const FeedbackDetailAdmin = () => {
  const { id } = useParams();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const navigate = useNavigate();
    
  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Admin.',
        icon: 'error',
      }).then(() => navigate('/login/admin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();
    return () => stopInactivityTracker();
  }, [navigate]);

  useEffect(() => {
    if (isAuthorized) {
      api.get(`/feedbacks/${id}`)
        .then((res) => {
          setFeedback(res.data.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          MySwal.fire({
            title: 'Gagal!',
            text: 'Feedback tidak ditemukan.',
            icon: 'error',
          }).then(() => navigate('/admin/feedbacks')); // kembali ke list
        });
    }
  }, [isAuthorized, id, navigate]);

  if (!isAuthorized || loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <h4 className="fw-bold mb-4">Detail Feedback</h4>

          <Card className="p-4">
            <Row>
              <Col md={6}>
                <h6>Nama Pelanggan</h6>
                <p>{feedback.user?.name || '-'}</p>
              </Col>
              <Col md={6}>
                <h6>Rating</h6>
                <Badge bg="warning" text="dark" style={{ fontSize: '1rem' }}>
                  {feedback.rating} ★
                </Badge>
              </Col>
            </Row>

            <hr />

            <h6>Subjek</h6>
            <p>{feedback.subject}</p>

            <h6>Isi Pesan</h6>
            <p>{feedback.message}</p>

            <h6>Tanggal</h6>
            <p>{new Date(feedback.created_at).toLocaleString('id-ID')}</p>

            <div className="mt-3">
              <Button variant="secondary" onClick={() => navigate('/admin/feedbacks')}>
                Kembali ke Daftar Feedback
              </Button>
            </div>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default FeedbackDetailAdmin;
