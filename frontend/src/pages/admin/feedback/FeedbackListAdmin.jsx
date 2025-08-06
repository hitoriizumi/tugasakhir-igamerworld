import React, { useEffect, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Container, Table, Spinner, Badge, Button } from 'react-bootstrap';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const FeedbackListAdmin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const perPage = 10;
  
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
        api.get(`/feedbacks?page=${currentPage}&per_page=${perPage}`)
        .then((res) => {
            setFeedbacks(res.data.data); // data array
            setTotalPages(res.data.last_page); // total halaman
            setLoading(false);
        })
        .catch((err) => {
            console.error(err);
            setLoading(false);
        });
    }
    }, [isAuthorized, currentPage]);

  if (!isAuthorized || loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <h4 className="mb-4 fw-bold">Daftar Feedback Pelanggan</h4>

          <Table striped bordered hover responsive>
            <thead>
                <tr>
                    <th>No</th>
                    <th>Nama Pelanggan</th>
                    <th>Subjek</th>
                    <th>Rating</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted">
                    Belum ada feedback yang tersedia.
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb, index) => (
                  <tr key={fb.id}>
                    <td>{(currentPage - 1) * perPage + index + 1}</td>
                    <td>{fb.user?.name || '-'}</td>
                    <td>{fb.subject}</td>
                    <td>
                      <Badge bg="warning" text="dark">{fb.rating} ★</Badge>
                    </td>
                    <td>{new Date(fb.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        onClick={() => navigate(`/admin/feedbacks/${fb.id}`)}
                      >
                        Lihat Detail
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center gap-3 mt-4 mb-4">
              <Button
                variant="primary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Sebelumnya
              </Button>

              <span className="align-self-center fw-semibold">
                {currentPage} dari {totalPages}
              </span>

              <Button
                variant="primary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default FeedbackListAdmin;
