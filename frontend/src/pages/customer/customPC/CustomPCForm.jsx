import React, { useEffect, useState, useMemo } from 'react';
import AOS from 'aos';
import {
  Container, Row, Col, Card, Button, Form, Alert, Modal
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';

const CustomPCForm = () => {
  const navigate = useNavigate();
  const BASE_IMAGE_URL = 'http://localhost:8000';

  const [components, setComponents] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [rakitOlehAdmin, setRakitOlehAdmin] = useState(false);
  const [metodePengambilan, setMetodePengambilan] = useState('ambil');
  const [isCustomer, setIsCustomer] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 600 });
    const token = localStorage.getItem('token_3');
    const role = localStorage.getItem('active_role');
    if (token && role === 'customer') setIsCustomer(true);

    const savedComponents = JSON.parse(localStorage.getItem('selectedComponents')) || [];
    const savedAccessories = JSON.parse(localStorage.getItem('selectedAccessories')) || [];
    setComponents(savedComponents);
    setAccessories(savedAccessories);
  }, []);

  const totalHarga = useMemo(() => {
    const totalKomponen = components.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const totalAksesoris = accessories.reduce((sum, item) => sum + Number(item.price || 0), 0);
    return totalKomponen + totalAksesoris;
  }, [components, accessories]);

  const handleSubmit = async () => {
    if (!isCustomer) return alert('Login sebagai pelanggan untuk mengirimkan pesanan.');

    try {
      const payload = {
        selected_components: components.map((p) => p.id),
        selected_accessories: accessories.map((p) => p.id),
        rakit_oleh_admin: rakitOlehAdmin,
        metode_pengambilan: metodePengambilan,
      };

      await api.post('/custom-pc-orders', payload);
      alert('Permintaan rakitan berhasil dikirim!');
      localStorage.removeItem('selectedComponents');
      localStorage.removeItem('selectedAccessories');
      navigate('/perakitan/saya');
    } catch {
      alert('Gagal mengirim permintaan. Silakan coba lagi nanti.');
    }
  };

  const openModal = (product) => {
    setModalProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setModalProduct(null);
    setShowModal(false);
  };

  const ProductCard = ({ item }) => (
    <Card
      className="h-100 shadow-sm border-0"
      style={{ cursor: 'pointer' }}
      onClick={() => openModal(item)}
      data-aos="zoom-in"
    >
      <Card.Img
        variant="top"
        src={item.main_image ? `${BASE_IMAGE_URL}/storage/${item.main_image}` : '/no-image.jpg'}
        style={{ height: '140px', objectFit: 'cover' }}
      />
      <Card.Body className="d-flex flex-column justify-content-between bg-dark text-white">
        <div>
          <Card.Title className="fs-6 text-truncate">{item.name}</Card.Title>
          <Card.Text className="text-warning small mb-0">Rp {Number(item.price).toLocaleString()}</Card.Text>
          <Card.Text className="text-warning small">Brand: {item.brand?.name || '-'}</Card.Text>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <>
      <NavbarCustomer />
      <Container fluid style={{ minHeight: '100vh', paddingTop: '90px', backgroundColor: '#1C1C1C' }}>
        <Container className="text-white pb-5">
          <h4 className="mb-2 text-center" data-aos="fade-down">Form Perakitan PC</h4>
          <p className="text-center mb-4" data-aos="fade-up">
            Isi form ini untuk menyelesaikan pesanan rakitan PC kamu. Pilih apakah ingin dirakit oleh toko,
            lalu lanjutkan dengan metode pengambilan yang diinginkan. Semua komponen dan aksesoris telah kamu pilih sebelumnya.
          </p>

          {!isCustomer && (
            <Alert variant="info" className="text-center" data-aos="fade-up">
              🔒 Login sebagai pelanggan untuk bisa mengirimkan pesanan. Guest hanya bisa melihat halaman ini.
            </Alert>
          )}

          {/* Komponen Dipilih */}
          <div data-aos="fade-up" className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Komponen Dipilih</h5>
              <Button size="sm" variant="light" onClick={() => navigate('/perakitan/komponen')}>
                Ubah
              </Button>
            </div>
            {components.length === 0 ? (
              <Alert variant="secondary" className="text-center">Belum ada komponen dipilih</Alert>
            ) : (
              <Row xs={2} sm={3} md={4} className="g-4">
                {components.map((item) => (
                  <Col key={item.id}>
                    <ProductCard item={item} />
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Aksesoris Dipilih */}
          <div data-aos="fade-up" className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Aksesoris Dipilih</h5>
              <Button size="sm" variant="outline-light" onClick={() => navigate('/perakitan/aksesoris')}>
                Ubah
              </Button>
            </div>
            {accessories.length === 0 ? (
              <Alert variant="secondary" className="text-center">Belum ada aksesoris dipilih</Alert>
            ) : (
              <Row xs={2} sm={3} md={4} className="g-4">
                {accessories.map((item) => (
                  <Col key={item.id}>
                    <ProductCard item={item} />
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Opsi Rakitan & Pengambilan */}
          <Row className="mb-4" data-aos="fade-up">
            <Col md={6}>
              <Form.Check
                type="checkbox"
                label="Dirakit oleh toko (biaya tambahan)"
                checked={rakitOlehAdmin}
                onChange={(e) => setRakitOlehAdmin(e.target.checked)}
              />
            </Col>
            <Col md={6}>
              <Form.Label>Metode Pengambilan</Form.Label>
              <Form.Select value={metodePengambilan} onChange={(e) => setMetodePengambilan(e.target.value)}>
                <option value="ambil">Ambil ke toko (Surabaya)</option>
                <option value="kirim">Dikirim ke alamat</option>
              </Form.Select>
            </Col>
          </Row>

          {/* Total Harga */}
          <Row className="mb-4" data-aos="fade-up">
            <Col xs={12}>
              <p className="fw-semibold fs-5 text-end mb-0">
                💰 Total Harga: Rp {totalHarga.toLocaleString()}
              </p>
            </Col>
          </Row>

          {/* Tombol Submit */}
          <div className="text-end" data-aos="fade-up">
            <Button variant="success" onClick={handleSubmit} disabled={!isCustomer}>
              Kirim Permintaan Rakitan
            </Button>
          </div>
        </Container>
      </Container>

      {/* Modal Detail */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detail Produk</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalProduct && (
            <>
              <img
                src={modalProduct.main_image ? `${BASE_IMAGE_URL}/storage/${modalProduct.main_image}` : '/no-image.jpg'}
                alt={modalProduct.name}
                className="img-fluid mb-3"
              />
              <h5>{modalProduct.name}</h5>
              <div dangerouslySetInnerHTML={{ __html: modalProduct.description }} />
              <p className="fw-semibold">Harga: Rp {Number(modalProduct.price).toLocaleString()}</p>
              <p>Subkategori: {modalProduct.subcategory?.name}</p>
              <p>Brand: {modalProduct.brand?.name}</p>
              <p>Socket: {modalProduct.socket?.code || '-'}</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Tutup</Button>
        </Modal.Footer>
      </Modal>

      <FooterCustomer />
    </>
  );
};

export default CustomPCForm;
