import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import { isAdmin } from '@/utils/authHelper';

const MySwal = withReactContent(Swal);

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', email: '', username: '', phone: '',
    current_password: '', new_password: '', confirm_password: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Silakan login sebagai admin.',
        icon: 'error',
      }).then(() => navigate('/login/admin'));
      return;
    }

    startInactivityTracker();
    return () => {
      stopInactivityTracker(); // 🧹 bersihkan saat keluar halaman
    };
  }, [navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/me');
        setProfile(res.data);
        setEditForm({
          name: res.data.name,
          email: res.data.email,
          username: res.data.username,
          phone: res.data.phone || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } catch (err) {
        console.error('Gagal mengambil profil:', err);
        alert('Terjadi kesalahan saat memuat profil.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.put('/me/update-profile', {
        name: editForm.name,
        email: editForm.email,
        username: editForm.username,
        phone: editForm.phone
      });

      if (editForm.current_password || editForm.new_password || editForm.confirm_password) {
        await api.put('/me/update-password', {
          current_password: editForm.current_password,
          new_password: editForm.new_password,
          confirm_password: editForm.confirm_password
        });
      }

      alert('Profil berhasil diperbarui!');
      setShowModal(false);
      setProfile({ ...profile, ...editForm });
    } catch (err) {
      console.error('Update gagal:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Gagal menyimpan perubahan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container className="py-4">
  <div className="mb-4">
    <h5 className="fw-bold">My Profile</h5>
  </div>

  {loading ? (
    <div className="text-center"><Spinner animation="border" /></div>
  ) : (
    <>
      {/* Card Header Profil */}
      <Card className="mb-4 shadow-sm border-0 p-3">
        <Row className="align-items-center">
          <Col xs={2} className="text-center">
            <div className="bg-light rounded-circle d-flex justify-content-center align-items-center" style={{ width: 64, height: 64 }}>
              <i className="bi bi-person-fill text-secondary" style={{ fontSize: '2rem' }}></i>
            </div>
          </Col>
          <Col>
            <h6 className="mb-1 fw-bold">{profile.name}</h6>
            <div className="text-muted small">{profile.username}</div>
            <div className="text-muted small">Admin</div>
          </Col>
        </Row>
      </Card>

      {/* Informasi Pribadi */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Header className="d-flex justify-content-between align-items-center bg-white border-bottom">
          <strong>Personal Information</strong>
          <Button size="sm" variant="warning" onClick={() => setShowModal(true)}>
            <i className="bi bi-pencil-square me-1"></i>Edit
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}><strong>Email Address</strong><br />{profile.email}</Col>
            <Col md={4}><strong>Phone Number</strong><br />{profile.phone || '-'}</Col>
            <Col md={4}><strong>Join Date</strong><br />{new Date(profile.created_at).toLocaleDateString()}</Col>
          </Row>
          <Row>
            <Col md={4}><strong>Username</strong><br />{profile.username}</Col>
            <Col md={4}><strong>User Role</strong><br />Admin</Col>
            <Col md={4}></Col>
          </Row>
        </Card.Body>
      </Card>
    </>
  )}
</Container>

      </div>

      {/* Modal Edit Profil */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditForm((prev) => ({
            ...prev,
            current_password: '',
            new_password: '',
            confirm_password: ''
          }));
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Profil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nama</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={editForm.username}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editForm.email}
                onChange={handleEditChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Nomor HP (opsional)</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={editForm.phone}
                onChange={handleEditChange}
              />
            </Form.Group>

            <hr />
            <h6 className="mb-3">Ubah Password (Opsional)</h6>

            <Form.Group className="mb-3">
              <Form.Label>Password Lama</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showCurrent ? 'text' : 'password'}
                  name="current_password"
                  value={editForm.current_password}
                  onChange={handleEditChange}
                  placeholder="Masukkan password lama"
                />
                <span
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showCurrent ? '🙈' : '👁️'}
                </span>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password Baru</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showNew ? 'text' : 'password'}
                  name="new_password"
                  value={editForm.new_password}
                  onChange={handleEditChange}
                  placeholder="Masukkan password baru"
                />
                <span
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showNew ? '🙈' : '👁️'}
                </span>
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Konfirmasi Password Baru</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  value={editForm.confirm_password}
                  onChange={handleEditChange}
                  placeholder="Ulangi password baru"
                />
                <span
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </span>
              </div>
            </Form.Group>

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Batal
              </Button>
              <Button type="submit" variant="success" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default AdminProfile;
