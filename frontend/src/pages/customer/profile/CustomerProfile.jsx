import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Card, Button, Modal, Form, Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authHelper'; // ✅ helper

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [form, setForm] = useState({
    name: '', username: '', email: '', phone: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', confirm_password: ''
  });

  // ✅ Validasi role: hanya pelanggan yang bisa akses
  useEffect(() => {
    AOS.init({ duration: 600 });

    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get('/me');
        setProfile(res.data);
        setForm({
          name: res.data.name || '',
          username: res.data.username || '',
          email: res.data.email || '',
          phone: res.data.phone || ''
        });
      } catch {
        Swal.fire('Gagal', 'Tidak dapat mengambil data profil', 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchPrimaryAddress = async () => {
      try {
        const res = await api.get('/customer/shipping-addresses');
        const primary = res.data.data.find(addr => addr.is_primary);
        setPrimaryAddress(primary || null);
      } catch {
        console.error('Gagal memuat alamat.');
      }
    };

    fetchPrimaryAddress();
    fetchProfile();
  }, [navigate]);

  const handleEditProfile = async () => {
    try {
      await api.put('/me/update-profile', form);
      Swal.fire('Berhasil', 'Profil berhasil diperbarui.', 'success');
      setShowEdit(false);
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperbarui profil.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.put('/me/update-password', passwordForm);
      Swal.fire('Berhasil', 'Password berhasil diubah.', 'success');
      setShowPassword(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah password.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh', color: 'white' }}>
        <Container style={{ maxWidth: '960px' }}>
          <h3 className="mb-4">Informasi Akun</h3>

          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : (
            <Row>
              <Col md={4}>
                <Card style={{ backgroundColor: '#2a2a2a' }} className="p-4 text-center">
                  <div style={{ fontSize: '4rem' }}>👤</div>
                  <div className="mt-3 fw-bold text-white">{profile.username}</div>
                </Card>
              </Col>

              <Col md={8}>
                <Card style={{ backgroundColor: '#2a2a2a', color: 'white' }} className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Informasi Pribadi</h5>
                    <Button size="sm" variant="warning" onClick={() => setShowEdit(true)}>Edit Profile</Button>
                  </div>
                  <hr style={{ borderColor: '#555' }} />
                  <Row>
                    <Col md={6} className="mb-3">
                      <p className="mb-1"><strong>Nama Lengkap:</strong></p>
                      <p className="mb-0">{profile.name}</p>
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="mb-1"><strong>Email:</strong></p>
                      <p className="mb-0">{profile.email}</p>
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="mb-1"><strong>Nomor Telepon:</strong></p>
                      <p className="mb-0">{profile.phone || '-'}</p>
                    </Col>
                    <Col md={6} className="mb-3">
                      <p className="mb-1"><strong>Tanggal Bergabung:</strong></p>
                      <p className="mb-0">
                        {new Date(profile.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </Col>
                  </Row>
                  <Button size="sm" variant="outline-light" onClick={() => setShowPassword(true)}>Ubah Password</Button>
                </Card>
                <hr style={{ borderColor: '#555' }} />
                  <h6 className="mb-2">Alamat Utama</h6>
                  {primaryAddress ? (
                    <div style={{ border: '1px solid gold', padding: '12px', borderRadius: '6px', backgroundColor: '#1C1C1C' }}>
                      <p className="mb-1 fw-bold">{primaryAddress.recipient_name}</p>
                      <p className="mb-1">{primaryAddress.phone_number}</p>
                      <p className="mb-0">
                        {primaryAddress.full_address}, {primaryAddress.city?.name}, {primaryAddress.province?.name} {primaryAddress.postal_code}
                      </p>
                    </div>
                  ) : (
                    <div className="alert alert-warning d-flex justify-content-between align-items-center mt-2">
                      <span className="me-3 mb-0">Kamu belum memiliki alamat utama. Yuk buat dulu!</span>
                      <Button size="sm" variant="dark" onClick={() => navigate('/customer/address')}>
                        Kelola Alamat
                      </Button>
                    </div>
                  )}
              </Col>
            </Row>
          )}
        </Container>
      </div>
      <FooterCustomer />

      {/* Modal Edit Profile */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Profil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nomor Telepon</Form.Label>
              <Form.Control
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Batal</Button>
          <Button variant="primary" onClick={handleEditProfile}>Simpan</Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Ubah Password */}
      <Modal show={showPassword} onHide={() => setShowPassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ubah Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Password Lama</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password Baru</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Konfirmasi Password Baru</Form.Label>
              <Form.Control
                type="password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPassword(false)}>Batal</Button>
          <Button variant="primary" onClick={handleChangePassword}>Simpan</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CustomerProfile;
