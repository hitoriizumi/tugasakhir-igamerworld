import React, { useEffect, useState } from 'react';
import api from '@/api/axiosInstance';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import {
  Table,
  Button,
  Container,
  Spinner,
  Badge,
  Form,
  Row,
  Col,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isSuperadmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSuperadmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Superadmin.',
        icon: 'warning',
      }).then(() => {
        navigate('/login/superadmin');
      });
      return;
    }

    startInactivityTracker();
    fetchAdmins();

    return () => stopInactivityTracker();
  }, [navigate]);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admins');
      setAdmins(res.data);
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
      MySwal.fire({
        title: 'Error!',
        text: 'Gagal memuat data admin.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await MySwal.fire({
      title: 'Yakin?',
      text: 'Ingin menonaktifkan akun admin ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Nonaktifkan',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/admins/${id}`);
        MySwal.fire('Berhasil!', 'Akun admin berhasil dinonaktifkan.', 'success');
        fetchAdmins();
      } catch (err) {
        console.error('Gagal menonaktifkan:', err);
        MySwal.fire('Gagal!', 'Terjadi kesalahan saat menonaktifkan akun.', 'error');
      }
    }
  };

  const handleRestore = async (id) => {
    const confirm = await MySwal.fire({
      title: 'Aktifkan kembali?',
      text: 'Akun admin akan diaktifkan kembali.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await api.put(`/admins/${id}/restore`);
        MySwal.fire('Berhasil!', 'Akun berhasil diaktifkan kembali.', 'success');
        fetchAdmins();
      } catch (err) {
        console.error('Gagal mengaktifkan kembali:', err);
        MySwal.fire('Gagal!', 'Terjadi kesalahan saat mengaktifkan akun.', 'error');
      }
    }
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/superadmin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4>Manajemen Admin</h4>
            <Button onClick={() => navigate('/superadmin/dashboard/manage-admin/add')}>
              + Tambah Admin
            </Button>
          </div>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Cari nama admin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Col>
          </Row>

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Nomor HP</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Tidak ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id}>
                      <td>{admin.name}</td>
                      <td>{admin.email}</td>
                      <td>{admin.phone || '-'}</td>
                      <td>
                        {admin.deleted_at ? (
                          <Badge bg="secondary">Nonaktif</Badge>
                        ) : (
                          <Badge bg="success">Aktif</Badge>
                        )}
                      </td>
                      <td>
                        {admin.deleted_at ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleRestore(admin.id)}
                          >
                            Aktifkan
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() =>
                                navigate(`/superadmin/dashboard/manage-admin/edit/${admin.id}`)
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(admin.id)}
                            >
                              Nonaktifkan
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Container>
      </div>
    </>
  );
};

export default AdminList;
