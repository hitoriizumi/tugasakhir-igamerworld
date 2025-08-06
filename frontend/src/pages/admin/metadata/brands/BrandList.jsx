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
import BrandFormModal from './BrandFormModal';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const BrandList = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
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

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands');
      setBrands(res.data.data);
    } catch (err) {
      console.error('Gagal memuat brand:', err);
      MySwal.fire({
        title: 'Error!',
        text: 'Gagal memuat data brand.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchBrands();
    }
  }, [isAuthorized]);

  const handleToggleStatus = async (id, isActive) => {
    const confirmResult = await MySwal.fire({
      title: 'Konfirmasi',
      text: isActive
        ? 'Yakin ingin menonaktifkan brand ini?'
        : 'Aktifkan kembali brand ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: isActive ? 'Nonaktifkan' : 'Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await api.patch(`/brands/${id}/toggle`);
      await fetchBrands();
      MySwal.fire({
        title: 'Berhasil!',
        text: isActive
          ? 'Brand berhasil dinonaktifkan.'
          : 'Brand berhasil diaktifkan kembali.',
        icon: 'success',
      });
    } catch (err) {
      console.error('Gagal mengubah status brand:', err);
      MySwal.fire('Error!', 'Gagal memperbarui status brand.', 'error');
    }
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedBrand(null);
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
            <h4 className="mb-0 fw-bold">Manajemen Brand</h4>
            <Button variant="primary" onClick={handleAdd}>+ Tambah Brand</Button>
          </div>

          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" />
            </div>
          ) : brands.length === 0 ? (
            <Alert variant="info" className="text-center">
              Belum ada brand yang tersedia.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table bordered hover responsive>
                <thead className="text-center">
                  <tr>
                    <th>Logo</th>
                    <th>Nama Brand</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id} className="align-middle text-center">
                      <td style={{ width: '100px' }}>
                        {brand.logo ? (
                          <Image src={brand.logo} height="50" rounded />
                        ) : (
                          <span className="text-muted">Tidak ada</span>
                        )}
                      </td>
                      <td>{brand.name}</td>
                      <td>
                        <Badge bg={brand.is_active ? 'success' : 'secondary'}>
                          {brand.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td>
                        {brand.is_active ? (
                          <>
                            <Button
                              size="sm"
                              variant="warning"
                              className="me-2"
                              onClick={() => handleEdit(brand)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                handleToggleStatus(brand.id, true)
                              }
                            >
                              Nonaktifkan
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() =>
                              handleToggleStatus(brand.id, false)
                            }
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

      <BrandFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialData={selectedBrand}
        onSuccess={fetchBrands}
      />
    </>
  );
};

export default BrandList;
