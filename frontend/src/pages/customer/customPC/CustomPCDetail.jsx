import React, { useEffect, useState, useMemo } from 'react';
import AOS from 'aos';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import {
  Container, Row, Col, Card, Spinner, Alert, Button, Modal
} from 'react-bootstrap';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import 'aos/dist/aos.css';

const CustomPCDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_IMAGE_URL = 'http://localhost:8000';

  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 600 });

    const token = localStorage.getItem('token_3');
    const role = localStorage.getItem('active_role');
    if (token && role === 'customer') setIsCustomer(true);

    const fetchData = async () => {
      try {
        const [orderRes, productsRes] = await Promise.all([
          api.get(`/custom-pc-orders/${id}`),
          api.get(`/products?per_page=1000`)
        ]);
        setOrder(orderRes.data);
        setProducts(productsRes.data.data || []);
      } catch {
        alert('Gagal memuat detail pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const totalHarga = useMemo(() => {
    const getProductById = (productId) =>
      Array.isArray(products) ? products.find((p) => p.id === productId) : null;

    const komponen = (order?.selected_components || [])
      .map((id) => getProductById(id))
      .filter(Boolean);

    const aksesoris = (order?.selected_accessories || [])
      .map((id) => getProductById(id))
      .filter(Boolean);

    return [...komponen, ...aksesoris].reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [order, products]);

  const getProductById = (productId) =>
    Array.isArray(products) ? products.find((p) => p.id === productId) : null;

  const productList = (ids = []) =>
    ids.map((id) => getProductById(id)).filter(Boolean);

  const openModal = (item) => {
    setModalProduct(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalProduct(null);
  };

  const ProductCard = ({ item }) => (
    <Card
      className="h-100 shadow-sm border-0"
      style={{ cursor: 'pointer' }}
      onClick={() => openModal(item)}
      // data-aos="zoom-in"
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

  if (loading) {
    return (
      <>
        <NavbarCustomer />
        <Container className="text-center mt-5">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <NavbarCustomer />
        <Container className="mt-5">
          <Alert variant="danger" className="text-center">Pesanan tidak ditemukan</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavbarCustomer />
      <Container style={{ paddingTop: '90px', minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
        <Container className="pb-5">
          <div className="d-flex justify-content-between align-items-center mb-4" data-aos="fade-down">
            <h4 className="text-primary mb-0">Detail Pesanan #{order.id}</h4>
            <Button variant="secondary" onClick={() => navigate('/perakitan/saya')}>
              Kembali
            </Button>
          </div>

          {!isCustomer && (
            <Alert variant="info" className="text-center" data-aos="fade-up">
              🔒 Kamu belum login sebagai pelanggan. Guest hanya bisa melihat halaman ini.
            </Alert>
          )}

          <Row className="mb-4" data-aos="fade-up">
            <Col md={6}>
              <p><strong>Status:</strong>{' '}
                <span className={`fw-semibold text-capitalize ${
                  order.status === 'approved' ? 'text-success' :
                  order.status === 'rejected' ? 'text-danger' : 'text-warning'
                }`}>
                  {order.status}
                </span>
              </p>
              <p><strong>Perakitan:</strong> {order.rakit_oleh_admin ? 'Dirakit oleh Admin' : 'Rakit Sendiri'}</p>
              <p><strong>Metode Pengambilan:</strong> {order.metode_pengambilan === 'ambil' ? 'Ambil di Toko' : 'Dikirim ke Alamat'}</p>
              {order.keterangan_admin && (
                <p><strong>Catatan Admin:</strong> {order.keterangan_admin}</p>
              )}
              <p className="fw-semibold fs-5 mt-3">💰 Total Harga: Rp {totalHarga.toLocaleString()}</p>
            </Col>
          </Row>

          <hr className="border-secondary" data-aos="fade-up" />

          <h5 className="mb-3" data-aos="fade-up">🧩 Komponen yang Dipilih</h5>
          <Row xs={2} sm={2} md={3} lg={4} className="g-4 mb-5">
            {productList(order.selected_components).map((product) => (
              <Col key={product.id}>
                <ProductCard item={product} />
              </Col>
            ))}
          </Row>

          <h5 className="mb-3" data-aos="fade-up">🎧 Aksesoris (Opsional)</h5>
          {order.selected_accessories.length === 0 ? (
            <Alert variant="light" data-aos="fade-up">Tidak ada aksesoris ditambahkan</Alert>
          ) : (
            <Row xs={2} sm={2} md={3} lg={4} className="g-4 mb-5">
              {productList(order.selected_accessories).map((product) => (
                <Col key={product.id}>
                  <ProductCard item={product} />
                </Col>
              ))}
            </Row>
          )}
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

export default CustomPCDetail;
