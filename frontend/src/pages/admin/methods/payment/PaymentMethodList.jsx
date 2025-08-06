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
import PaymentMethodFormModal from './PaymentMethodFormModal';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const PaymentMethodList = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
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

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payment-methods');
      setMethods(res.data.data);
    } catch (err) {
      console.error('Gagal memuat metode pembayaran:', err);
      MySwal.fire('Error!', 'Gagal memuat data metode pembayaran.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) fetchMethods();
  }, [isAuthorized]);

  const handleToggleStatus = async (id, isActive) => {
    const confirm = await MySwal.fire({
      title: 'Konfirmasi',
      text: isActive
        ? 'Yakin ingin menonaktifkan metode ini?'
        : 'Aktifkan kembali metode ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isActive ? 'Nonaktifkan' : 'Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.patch(`/payment-methods/${id}/toggle`);
      await fetchMethods();
      MySwal.fire({
        title: 'Berhasil!',
        text: isActive
          ? 'Metode pembayaran berhasil dinonaktifkan.'
          : 'Metode pembayaran berhasil diaktifkan kembali.',
        icon: 'success',
      });
    } catch (err) {
      console.error('Gagal ubah status metode pembayaran:', err);
      MySwal.fire('Error!', 'Gagal memperbarui status metode pembayaran.', 'error');
    }
  };

  const handleEdit = (method) => {
    setSelectedMethod(method);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedMethod(null);
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
            <h4 className="mb-0 fw-bold">Manajemen Metode Pembayaran</h4>
            <Button variant="primary" onClick={handleAdd}>+ Tambah Metode</Button>
          </div>

          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" />
            </div>
          ) : methods.length === 0 ? (
            <Alert variant="info" className="text-center">
              Belum ada metode pembayaran yang tersedia.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table bordered hover responsive>
                <thead className="text-center">
                  <tr>
                    <th>Logo</th>
                    <th>Bank / Metode</th>
                    <th>No. Rekening</th>
                    <th>Atas Nama</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method) => (
                    <tr key={method.id} className="align-middle text-center">
                      <td style={{ width: '100px' }}>
                        {method.image ? (
                          <Image src={method.image} height="50" rounded />
                        ) : (
                          <span className="text-muted">Tidak ada</span>
                        )}
                      </td>
                      <td>{method.bank_name}</td>
                      <td>{method.account_number || '-'}</td>
                      <td>{method.account_holder || '-'}</td>
                      <td>
                        <Badge bg={method.is_active ? 'success' : 'secondary'}>
                          {method.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td>
                        {method.is_active ? (
                          <>
                            <Button
                              size="sm"
                              variant="warning"
                              className="me-2"
                              onClick={() => handleEdit(method)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => handleToggleStatus(method.id, true)}
                            >
                              Nonaktifkan
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => handleToggleStatus(method.id, false)}
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

      <PaymentMethodFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialData={selectedMethod}
        onSuccess={fetchMethods}
      />
    </>
  );
};

export default PaymentMethodList;
