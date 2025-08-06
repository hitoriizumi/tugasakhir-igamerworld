import React, { useState, useEffect, useCallback } from 'react';
import { Container, Form, Button, Card, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isSuperadmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const EditAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
  });

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

    return () => stopInactivityTracker();
  }, [navigate]);

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await api.get(`/admins/${id}`);
      setForm({
        name: res.data.name,
        username: res.data.username || '',
        email: res.data.email,
        phone: res.data.phone || '',
      });
    } catch (err) {
      console.error('Gagal mengambil data admin:', err);
      MySwal.fire({
        title: 'Error!',
        text: 'Gagal memuat data admin.',
        icon: 'error',
      }).then(() => {
        navigate('/superadmin/dashboard/manage-admin');
      });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admins/${id}`, form);
      MySwal.fire({
        title: 'Berhasil!',
        text: 'Data admin berhasil diperbarui!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/superadmin/dashboard/manage-admin');
      });
    } catch (err) {
      console.error('Gagal update admin:', err.response?.data || err.message);
      MySwal.fire({
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat update data admin.',
        icon: 'error',
      });
    }
  };

  if (loading) {
    return (
      <>
        <DashboardSidebar />
        <DashboardNavbar redirectLogout="/login/superadmin" />
        <div className="text-center mt-5" style={{ paddingLeft: '80px' }}>
          <Spinner animation="border" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/superadmin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container className="d-flex justify-content-center">
          <Card style={{ width: '100%', maxWidth: '600px' }} className="p-4 shadow rounded-4">
            <h4 className="mb-4 text-center">Edit Data Admin</h4>
            <Form onSubmit={handleUpdate}>
              <Form.Group className="mb-3">
                <Form.Label>Nama Lengkap</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Nama Lengkap"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  placeholder="Username unik"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="Email Admin"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Nomor HP (opsional)</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                />
              </Form.Group>

              <div className="d-flex justify-content-between">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/superadmin/dashboard/manage-admin')}
                >
                  Batal
                </Button>
                <Button variant="primary" type="submit">
                  Simpan Perubahan
                </Button>
              </div>
            </Form>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default EditAdmin;
