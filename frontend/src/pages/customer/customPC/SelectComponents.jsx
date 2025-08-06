import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Spinner, Modal, Alert, Form, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';

const REQUIRED_COMPONENTS = ['Motherboard', 'Processor', 'RAM', 'Storage', 'PSU', 'Casing', 'GPU'];
const DUPLICATE_ALLOWED = ['RAM', 'Storage', 'Cooler', 'Fan'];

const SelectComponents = () => {
  const navigate = useNavigate();
  const BASE_IMAGE_URL = 'http://localhost:8000';

  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(JSON.parse(localStorage.getItem('selectedComponents')) || []);
  const [metadata, setMetadata] = useState({ subcategories: [], brands: [], sockets: [] });
  const [filter, setFilter] = useState({ subcategory_id: '', brand_id: '', socket_id: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [isCustomer, setIsCustomer] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token_3');
    const role = localStorage.getItem('active_role');
    if (token && role === 'customer') setIsCustomer(true);
  }, []);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await api.get('/products/metadata');
      setMetadata(res.data);
    } catch {
      console.error('Gagal mengambil metadata');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        ...filter,
        category_id: 1,
        status_stock: 'ready'
      }).toString();
      const res = await api.get(`/products?${query}`);
      setProducts(res.data.data || res.data);
    } catch {
      alert('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMetadata();
    fetchProducts();
  }, [fetchMetadata, fetchProducts]);

  const selectedSocket = useMemo(() => {
    const motherboard = selected.find(p => p.subcategory.name === 'Motherboard');
    return motherboard?.socket?.code || null;
  }, [selected]);

  const isCompatible = (product) => {
    if (!selectedSocket || !product.socket?.code) return true;
    if (product.subcategory.name === 'Processor') {
      return product.socket.code === selectedSocket;
    }
    return true;
  };

  const handleAdd = (product) => {
    if (!isCustomer) return alert('Login sebagai pelanggan untuk memilih komponen.');

    const exists = selected.some((item) => item.subcategory.name === product.subcategory.name);
    const isDuplicateAllowed = DUPLICATE_ALLOWED.includes(product.subcategory.name);

    if (exists && !isDuplicateAllowed) {
      return alert(`Komponen dari subkategori "${product.subcategory.name}" sudah dipilih.`);
    }

    if (!isCompatible(product)) {
      return alert(`Komponen ini tidak kompatibel dengan motherboard yang dipilih (socket mismatch).`);
    }

    const updated = [...selected, product];
    setSelected(updated);
    localStorage.setItem('selectedComponents', JSON.stringify(updated));
  };

  const handleRemove = (id) => {
    const updated = selected.filter((item) => item.id !== id);
    setSelected(updated);
    localStorage.setItem('selectedComponents', JSON.stringify(updated));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSub = !filter.subcategory_id || p.subcategory_id == filter.subcategory_id;
      const matchBrand = !filter.brand_id || p.brand_id == filter.brand_id;
      const matchSocket = !filter.socket_id || p.socket_id == filter.socket_id;
      const matchSearch = !filter.search || p.name.toLowerCase().includes(filter.search.toLowerCase());
      return matchSub && matchBrand && matchSocket && matchSearch;
    });
  }, [products, filter]);

  const isComponentComplete = () => {
    const countMap = {};
    selected.forEach((item) => {
      const name = item.subcategory.name;
      countMap[name] = (countMap[name] || 0) + 1;
    });
    return REQUIRED_COMPONENTS.every((key) => countMap[key]);
  };

  const openModal = (product) => {
    setModalProduct(product);
    setShowModal(true);
  };

  const closeModal = () => {
    setModalProduct(null);
    setShowModal(false);
  };

  const handleBack = () => {
    if (selected.length === 0) {
      navigate(-1);
    } else if (!isComponentComplete()) {
      const confirmDiscard = window.confirm(
        '⚠️ Kamu sedang memilih komponen untuk rakitan PC.\nJika kembali sekarang, semua pilihan akan dihapus dan kamu harus memulai dari awal.\n\nApakah kamu yakin ingin keluar?'
      );
      if (confirmDiscard) {
        localStorage.removeItem('selectedComponents');
        setSelected([]);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const stepStatus = (sub) => {
    const count = selected.filter(p => p.subcategory.name === sub).length;
    return count > 0 ? '✅' : '⏳';
  };

  return (
    <>
      <NavbarCustomer />
      <Container fluid style={{ minHeight: '100vh', paddingTop: '90px', backgroundColor: '#1C1C1C' }}>
        <Container className="text-white pb-5">
          <Button variant="warning" className="mb-3" onClick={handleBack}>
            Kembali
          </Button>
          <h4 className="mb-4 text-center">Pilih Komponen untuk PC Rakitan</h4>

          {/* Step Guide */}
          <div className="mb-4 d-flex flex-wrap justify-content-center gap-3">
            {REQUIRED_COMPONENTS.map((name, i) => (
              <Badge key={i} bg={selected.find(p => p.subcategory.name === name) ? 'success' : 'secondary'}>
                {stepStatus(name)} {name}
              </Badge>
            ))}
          </div>

          {selectedSocket && (
            <p className="text-center text-warning mb-4">
              💡 Motherboard dengan socket <strong>{selectedSocket}</strong> telah dipilih.
              Pilih processor yang sesuai agar kompatibel.
            </p>
          )}

          {/* Komponen Dipilih */}
          <Row className="mb-5">
            <Col>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Komponen Dipilih</h5>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => {
                    if (!isCustomer) return alert('Login terlebih dahulu.');
                    if (!isComponentComplete()) return alert('Komponen wajib belum lengkap!');
                    navigate('/perakitan/form');
                  }}
                >
                  Selesai & Lihat Ringkasan
                </Button>
              </div>
              {selected.length === 0 ? (
                <Alert variant="secondary" className="text-center">Belum ada komponen dipilih</Alert>
              ) : (
                <Row xs={2} sm={3} md={4} className="g-4">
                  {selected.map((item) => (
                    <Col key={item.id}>
                      <Card className="h-100 shadow-sm border-0">
                        <Card.Img
                          variant="top"
                          src={item.main_image ? `${BASE_IMAGE_URL}/storage/${item.main_image}` : '/no-image.jpg'}
                          style={{ height: '140px', objectFit: 'cover' }}
                        />
                        <Card.Body className="p-2 text-center bg-dark text-white">
                          <small className="fw-semibold d-block mb-2">{item.name}</small>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={() => handleRemove(item.id)}
                          >
                            ❌
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          </Row>

          {/* Filter */}
          <Row className="mb-4">
            <Col md={4} className="mb-2">
              <Form.Select
                value={filter.subcategory_id}
                onChange={(e) => setFilter({ ...filter, subcategory_id: e.target.value })}
              >
                <option value="">Subkategori</option>
                {metadata.subcategories
                  .filter((s) => s.category_id === 1)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </Form.Select>
            </Col>
            <Col md={4} className="mb-2">
              <Form.Select
                value={filter.brand_id}
                onChange={(e) => setFilter({ ...filter, brand_id: e.target.value })}
              >
                <option value="">Brand</option>
                {metadata.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={4} className="mb-2">
              <Form.Select
                value={filter.socket_id}
                onChange={(e) => setFilter({ ...filter, socket_id: e.target.value })}
              >
                <option value="">Socket</option>
                {metadata.sockets.map((s) => (
                  <option key={s.id} value={s.id}>{s.code}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {/* Produk */}
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Row xs={2} sm={3} md={4} className="g-4">
              {filteredProducts.map((product) => (
                <Col key={product.id}>
                  <Card className="h-100 shadow-sm border-0">
                    <Card.Img
                      variant="top"
                      src={product.main_image ? `${BASE_IMAGE_URL}/storage/${product.main_image}` : '/no-image.jpg'}
                      style={{ height: '150px', objectFit: 'cover' }}
                    />
                    <Card.Body className="d-flex flex-column justify-content-between bg-dark text-white">
                      <div>
                        <Card.Title className="fs-6 text-truncate">{product.name}</Card.Title>
                        <Card.Text className="fw-semibold mb-1">Rp {Number(product.price).toLocaleString()}</Card.Text>
                        <Card.Text className="text-warning small mb-0">Socket: {product.socket?.code || '-'}</Card.Text>
                        <Card.Text className="text-warning small">Brand: {product.brand?.name || '-'}</Card.Text>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <Button
                          variant={isCustomer ? 'primary' : 'secondary'}
                          size="sm"
                          disabled={!isCustomer || !isCompatible(product)}
                          onClick={() => handleAdd(product)}
                        >
                          ➕ Tambah
                        </Button>
                        <Button variant="outline-light" size="sm" onClick={() => openModal(product)}>
                          🔍 Detail
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

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
        </Container>
      </Container>
      <FooterCustomer />
    </>
  );
};

export default SelectComponents;
