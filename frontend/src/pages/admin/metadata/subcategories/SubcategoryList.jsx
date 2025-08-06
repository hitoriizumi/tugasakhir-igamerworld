import React, { useEffect, useState } from 'react';
import api from '@/api/axiosInstance';
import {
  Button,
  Container,
  Spinner,
  Table,
  Badge,
  Alert,
} from 'react-bootstrap';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import SubcategoryFormModal from './SubcategoryFormModal';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const SubcategoryList = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
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

  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subcategories');
      setSubcategories(res.data.data);
    } catch (err) {
      console.error('Gagal memuat subkategori:', err);
      MySwal.fire({
        title: 'Error!',
        text: 'Gagal memuat data subkategori.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchSubcategories();
    }
  }, [isAuthorized]);

  const handleToggleStatus = async (id, isActive) => {
    const confirm = await MySwal.fire({
      title: 'Konfirmasi',
      text: isActive
        ? 'Yakin ingin menonaktifkan subkategori ini?'
        : 'Aktifkan kembali subkategori ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: isActive ? 'Nonaktifkan' : 'Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.patch(`/subcategories/${id}/toggle`);
      await fetchSubcategories();
      MySwal.fire('Berhasil!', 'Status subkategori diperbarui.', 'success');
    } catch (err) {
      console.error('Gagal memperbarui status:', err);
      MySwal.fire('Error!', 'Gagal memperbarui status.', 'error');
    }
  };

  const handleEdit = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedSubcategory(null);
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
            <h4 className="mb-0 fw-bold">Manajemen Subkategori</h4>
            <Button variant="primary" onClick={handleAdd}>
              + Tambah Subkategori
            </Button>
          </div>

          {loading ? (
            <div className="text-center mt-5">
              <Spinner animation="border" />
            </div>
          ) : subcategories.length === 0 ? (
            <Alert variant="info" className="text-center">
              Belum ada subkategori yang tersedia.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table bordered hover responsive>
                <thead className="text-center">
                  <tr>
                    <th>Nama Subkategori</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {subcategories.map((sub) => (
                    <tr key={sub.id} className="align-middle text-center">
                      <td>{sub.name}</td>
                      <td>{sub.category?.name || '-'}</td>
                      <td>
                        <Badge bg={sub.is_active ? 'success' : 'secondary'}>
                          {sub.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td>
                        {sub.is_active ? (
                          <>
                            <Button
                              size="sm"
                              variant="warning"
                              className="me-2"
                              onClick={() => handleEdit(sub)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                handleToggleStatus(sub.id, true)
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
                              handleToggleStatus(sub.id, false)
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

      <SubcategoryFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        initialData={selectedSubcategory}
        onSuccess={fetchSubcategories}
      />
    </>
  );
};

export default SubcategoryList;
