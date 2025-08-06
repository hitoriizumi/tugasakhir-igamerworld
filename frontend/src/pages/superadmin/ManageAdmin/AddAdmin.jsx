import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isSuperadmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const AddAdmin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admins', form); // kirim semua data termasuk username
      MySwal.fire({
        title: 'Berhasil!',
        text: 'Akun admin berhasil ditambahkan!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/superadmin/dashboard/manage-admin');
      });
    } catch (err) {
      console.error('Gagal tambah admin:', err.response?.data || err.message);
      MySwal.fire({
        title: 'Gagal!',
        text: 'Gagal menambahkan admin. Cek kembali data yang diisi.',
        icon: 'error',
      });
    }
  };

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/superadmin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container className="d-flex justify-content-center">
          <Card style={{ width: '100%', maxWidth: '600px' }} className="p-4 shadow rounded-4">
            <h4 className="mb-4 text-center">Tambah Admin Baru</h4>
            <Form onSubmit={handleSubmit}>
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

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Minimal 8 karakter"
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
                <Button variant="secondary" onClick={() => navigate('/superadmin/dashboard/manage-admin')}>
                  Batal
                </Button>
                <Button variant="success" type="submit">
                  Simpan
                </Button>
              </div>
            </Form>
          </Card>
        </Container>
      </div>
    </>
  );
};

export default AddAdmin;
