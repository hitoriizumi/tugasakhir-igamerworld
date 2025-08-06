import React, { useEffect, useState } from 'react';
import api from '@/api/axiosInstance';
import {
  Button,
  Container,
  Spinner,
  Table,
  Badge,
  Image,
  Alert,
} from 'react-bootstrap';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import CourierFormModal from './CourierFormModal';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const CourierList = () => {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
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

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/couriers');
      setCouriers(res.data.data);
    } catch (err) {
      console.error('Gagal memuat data kurir:', err);
      MySwal.fire('Error!', 'Gagal memuat data kurir.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchCouriers();
  }, [isAuthorized]);

  const handleToggleStatus = async (id, isActive) => {
    const confirm = await MySwal.fire({
      title: 'Konfirmasi',
      text: isActive
        ? 'Yakin ingin menonaktifkan kurir ini?'
        : 'Aktifkan kembali kurir ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isActive ? 'Nonaktifkan' : 'Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.patch(`/couriers/${id}/toggle`);
      await fetchCouriers();
      MySwal.fire({
        title: 'Berhasil!',
        text: isActive
          ? 'Kurir berhasil dinonaktifkan.'
          : 'Kurir berhasil diaktifkan kembali.',
        icon: 'success',
      });
    } catch (err) {
      console.error('Gagal mengubah status kurir:', err);
      MySwal.fire('Error!', 'Gagal mengubah status kurir.', 'error');
    }
  };

  const handleEdit = (courier) => {
    setSelectedCourier(courier);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedCourier(null);
    setShowModal(true);
  };

  if (!isAuthorized) return null;

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div className="pt-3" style={{ minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h4 className="mb-0 fw-bold">Manajemen Kurir</h4>
            <Button variant="primary" onClick={handleAdd}>+ Tambah Kurir</Button>
          </div>

          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" />
            </div>
          ) : couriers.length === 0 ? (
            <Alert variant="info" className="text-center">
              Belum ada kurir yang tersedia.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table bordered hover responsive>
                <thead className="text-center">
                  <tr>
                    <th>Logo</th>
                    <th>Nama Kurir</th>
                    <th>Kode</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {couriers.map((courier) => (
                    <tr key={courier.id} className="align-middle text-center">
                      <td style={{ width: '100px' }}>
                        {courier.image ? (
                          <Image src={courier.image} height="50" rounded />
                        ) : (
                          <span className="text-muted">Tidak ada</span>
                        )}
                      </td>
                      <td>{courier.name}</td>
                      <td>{courier.code}</td>
                      <td>
                        <Badge bg={courier.is_active ? 'success' : 'secondary'}>
                          {courier.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td>
                        {courier.is_active ? (
                          <>
                            <Button
                              size="sm"
                              variant="warning"
                              className="me-2"
                              onClick={() => handleEdit(courier)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleToggleStatus(courier.id, true)}
                            >
                              Nonaktifkan
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => handleToggleStatus(courier.id, false)}
                          >
                            Aktifkan
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Container>
      </div>

      <CourierFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialData={selectedCourier}
        onSuccess={fetchCouriers}
      />
    </>
  );
};

export default CourierList;
