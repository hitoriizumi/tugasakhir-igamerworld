import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Modal, Spinner, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import { isCustomer } from '@/utils/authHelper'; // ✅ import helper role

const CustomerAddressPage = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState({
    recipient_name: '',
    phone_number: '',
    full_address: '',
    province_id: '',
    city_id: '',
    postal_code: '',
    notes: '',
  });

  useEffect(() => {
    const hasFormChanged = Object.values(form).some(val => val !== '');

    const handleBeforeUnload = (e) => {
      if (hasFormChanged) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [form]);

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await api.get('/customer/shipping-addresses');
      setAddresses(res.data.data);
    } catch {
      Swal.fire('Gagal', 'Gagal memuat alamat.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProvinces = async () => {
    const res = await api.get('/provinces');
    setProvinces(res.data.data);
  };

  const fetchCities = async (provinceId) => {
    const res = await api.get(`/provinces/${provinceId}/cities`);
    setCities(res.data.data);
  };

  useEffect(() => {
    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    fetchAddresses();
    fetchProvinces();
  }, [fetchAddresses, navigate]);

  const handleProvinceChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, province_id: value, city_id: '' });
    fetchCities(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customer/shipping-addresses', form);
      Swal.fire('Berhasil', 'Alamat berhasil ditambahkan.', 'success');
      setForm({
        recipient_name: '',
        phone_number: '',
        full_address: '',
        province_id: '',
        city_id: '',
        postal_code: '',
        notes: '',
      });
      setCities([]);
      fetchAddresses();
    } catch {
      Swal.fire('Gagal', 'Gagal menambahkan alamat.', 'error');
    }
  };

  const handleToggleActive = async (id, isPrimary) => {
    if (isPrimary) {
      Swal.fire('Tidak Bisa', 'Alamat utama tidak bisa dinonaktifkan.', 'info');
      return;
    }
    const confirm = await Swal.fire({
      title: 'Ubah status alamat?',
      text: 'Alamat akan dinonaktifkan/diaktifkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      setLoading(true); // ✅ agar UI refresh ulang benar-benar pakai data terbaru
      await api.patch(`/customer/shipping-addresses/${id}/toggle-active`);
      await fetchAddresses();
    }
  };

  const handleSetPrimary = async (id, isActive) => {
    if (!isActive) {
      Swal.fire('Gagal', 'Alamat tidak aktif tidak bisa dijadikan utama.', 'info');
      return;
    }
    const confirm = await Swal.fire({
      title: 'Jadikan alamat utama?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      await api.patch(`/customer/shipping-addresses/${id}/set-primary`);
      fetchAddresses();
    }
  };

  const handleEdit = (address) => {
    setSelectedEdit(address);
    setForm({
      recipient_name: address.recipient_name,
      phone_number: address.phone_number,
      full_address: address.full_address,
      province_id: address.province_id,
      city_id: address.city_id,
      postal_code: address.postal_code,
      notes: address.notes,
    });
    fetchCities(address.province_id);
    setShowModal(true);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/customer/shipping-addresses/${selectedEdit.id}`, form);
      setShowModal(false);
      fetchAddresses();
      Swal.fire('Berhasil', 'Alamat berhasil diperbarui.', 'success');
    } catch {
      Swal.fire('Gagal', 'Gagal mengedit alamat.', 'error');
    }
  };

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white' }}>
          <h2 className="mb-4">Alamat</h2>
          <Row>
            <Col md={6}>
              {loading ? (
                <Spinner animation="border" variant="light" />
              ) : addresses.length === 0 ? (
                <div className="alert alert-warning" style={{ fontSize: '0.9rem' }}>
                  Belum ada alamat kamu nih, buat yuk di samping
                </div>
              ) : (
                addresses.map(addr => (
                  <Card key={addr.id} className="mb-3" style={{ border: '1px solid #FFD700', backgroundColor: '#1C1C1C', color: 'white' }}>
                    <Card.Body>
                      <h5>{addr.recipient_name}</h5>
                      <p>{addr.phone_number}</p>
                      <p>{addr.full_address}, {addr.city?.name}, {addr.province?.name} {addr.postal_code}</p>
                      <div className="d-flex gap-2">
                        <Button variant="outline-light" size="sm" onClick={() => handleEdit(addr)}>Edit</Button>
                        {/* <Button variant="danger" size="sm" onClick={() => handleToggleActive(addr.id, addr.is_primary)}>Nonaktifkan</Button> */}
                        <Button
                          variant={addr.is_active ? 'danger' : 'success'}
                          size="sm"
                          onClick={() => handleToggleActive(addr.id, addr.is_primary)}
                        >
                          {addr.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                        {addr.is_primary ? (
                          <Badge bg="success" className="align-self-center">Utama</Badge>
                        ) : (
                          <Button variant="warning" size="sm" onClick={() => handleSetPrimary(addr.id, addr.is_active)}>Gunakan</Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))
              )}
            </Col>
            <Col md={6}>
              <Card style={{ border: '1px solid #FFD700', backgroundColor: '#1C1C1C', color: 'white' }}>
                <Card.Body>
                  <h5>Tambah Alamat</h5>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-2">
                      <Form.Label>Nama penerima</Form.Label>
                      <Form.Control value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Nomor HP</Form.Label>
                      <Form.Control value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Alamat lengkap</Form.Label>
                      <Form.Control value={form.full_address} onChange={e => setForm({ ...form, full_address: e.target.value })} required />
                    </Form.Group>
                    <Row>
                      <Col>
                        <Form.Group className="mb-2">
                          <Form.Label>Provinsi</Form.Label>
                          <Form.Select value={form.province_id} onChange={handleProvinceChange} required>
                            <option value="">Pilih Provinsi</option>
                            {provinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group className="mb-2">
                          <Form.Label>Kota/Kabupaten</Form.Label>
                          <Form.Select value={form.city_id} onChange={e => setForm({ ...form, city_id: e.target.value })} required>
                            <option value="">Pilih Kota</option>
                            {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-2">
                      <Form.Label>Kode Pos</Form.Label>
                      <Form.Control value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Catatan</Form.Label>
                      <Form.Control value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </Form.Group>
                    <Button variant="warning" type="submit">Tambahkan</Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Modal Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Edit Alamat</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nama penerima</Form.Label>
              <Form.Control value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Nomor HP</Form.Label>
              <Form.Control value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Alamat lengkap</Form.Label>
              <Form.Control value={form.full_address} onChange={e => setForm({ ...form, full_address: e.target.value })} />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Provinsi</Form.Label>
                  <Form.Select value={form.province_id} onChange={handleProvinceChange}>
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>Kota/Kabupaten</Form.Label>
                  <Form.Select value={form.city_id} onChange={e => setForm({ ...form, city_id: e.target.value })}>
                    <option value="">Pilih Kota</option>
                    {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-2">
              <Form.Label>Kode Pos</Form.Label>
              <Form.Control value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Catatan</Form.Label>
              <Form.Control value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="warning" onClick={handleUpdate}>Simpan</Button>
        </Modal.Footer>
      </Modal>

      <FooterCustomer />
    </>
  );
};

export default CustomerAddressPage;
