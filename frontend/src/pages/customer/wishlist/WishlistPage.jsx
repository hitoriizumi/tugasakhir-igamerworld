import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Spinner, InputGroup, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Trash2, ShoppingCart } from 'lucide-react';
import { isCustomer } from '@/utils/authHelper';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [cartProductIds, setCartProductIds] = useState([]);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await api.get('/wishlist');
      setWishlist(res.data.data);
    } catch {
      Swal.fire('Gagal', 'Gagal memuat wishlist', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCartIds = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      const ids = res.data.data.map(item => item.product.id);
      setCartProductIds(ids);
    } catch {
      console.error('Gagal mengambil cart.');
    }
  }, []);

  useEffect(() => {
    AOS.init({ duration: 600 });

    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    fetchWishlist();
    fetchCartIds();
  }, [fetchWishlist, fetchCartIds, navigate]);

  const handleDeleteWishlist = async (productId) => {
    const confirm = await Swal.fire({
      title: 'Hapus produk dari wishlist?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/wishlist/${productId}`);
        setWishlist(prev => prev.filter(w => w.product.id !== productId));
      } catch {
        Swal.fire('Gagal', 'Tidak dapat menghapus dari wishlist', 'error');
      }
    }
  };

  const handleAddToCart = async (product) => {
    if (!isCustomer()) {
      Swal.fire('Harus Login', 'Silakan login sebagai pelanggan terlebih dahulu.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    if (product.status_stock === 'out_of_stock') {
      Swal.fire('Produk Habis', 'Produk sudah habis, cari yang lain yuk!', 'info');
      return;
    }

    if (cartProductIds.includes(product.id)) {
      Swal.fire('Sudah Ada', 'Produk sudah ada di keranjang.', 'info');
      return;
    }

    try {
      await api.post('/cart', {
        product_id: product.id,
        quantity: 1
      });

      setCartProductIds(prev => [...prev, product.id]);
      Swal.fire('Berhasil', 'Produk ditambahkan ke keranjang.', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan saat menambahkan ke keranjang.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  const renderBadge = (status) => {
    switch (status) {
      case 'ready_stock':
        return <Badge bg="success">READY STOCK</Badge>;
      case 'pre_order':
        return <Badge bg="warning" text="dark">PRE ORDER</Badge>;
      case 'out_of_stock':
        return <Badge bg="secondary">OUT OF STOCK</Badge>;
      default:
        return null;
    }
  };


  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);

  const filteredWishlist = wishlist.filter(({ product }) => {
    const keywordLower = keyword.toLowerCase();
    return (
      product.name.toLowerCase().includes(keywordLower) ||
      product.subcategory?.name?.toLowerCase().includes(keywordLower) ||
      product.subcategory?.category?.name?.toLowerCase().includes(keywordLower) ||
      product.brand?.name?.toLowerCase().includes(keywordLower)
    );
  });

  const sortedWishlist = [
    ...filteredWishlist.filter(item =>
      item.product.status_stock !== 'out_of_stock'
    ),
    ...filteredWishlist.filter(item =>
      item.product.status_stock === 'out_of_stock'
    )
  ];

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white' }}>
          <h2 className="mb-4">Daftar Wishlist</h2>
          <InputGroup className="mb-4">
            <Form.Control
              placeholder="Cari di wishlist..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button variant="outline-light">Search</Button>
          </InputGroup>

          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : filteredWishlist.length === 0 ? (
            <div
              className="d-flex flex-column align-items-center justify-content-center w-100"
              style={{ minHeight: '50vh', textAlign: 'center' }}
            >
              <img
                src="/image/notfound.png"
                alt="Produk tidak ditemukan"
                style={{ maxWidth: '200px', marginBottom: '1rem' }}
              />
              <div className="alert alert-warning w-auto" style={{ fontSize: '0.95rem' }}>
                Produk tidak tersedia. Coba ubah filter atau cari kata kunci lain.
              </div>
            </div>
          ) : (
            <Row xs={2} md={3} lg={6} className="g-4">
              {sortedWishlist.map(({ id, product }) => (
                <Col key={id}>
                  <Card
                    className="h-100"
                    style={{ backgroundColor: '#2a2a2a', color: 'white', cursor: 'pointer' }}
                    onClick={() => navigate(`/produk/${product.id}`)}
                  >
                    <Card.Img
                      variant="top"
                      src={product.images[0]?.image_url || product.main_image}
                      style={{
                        height: '180px',
                        objectFit: 'cover',
                        backgroundColor: '#fff'
                      }}
                    />
                    <Card.Body className="d-flex flex-column">
                      <div
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: 'white',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={product.name} // Tooltip saat hover
                      >
                        {product.name.length > 60 ? product.name.substring(0, 60) + '...' : product.name}
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', color: '#FFD700', fontWeight: '600' }}>
                        {formatCurrency(product.price)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>
                        {product.brand?.name}
                      </div>
                      <div className="mb-2">
                        {renderBadge(product.status_stock)}
                      </div>
                      <div className="mt-auto d-flex justify-content-between align-items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className="w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.status_stock === 'out_of_stock'}
                        >
                          <ShoppingCart size={16} className="me-1" />
                          Tambah
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          style={{ width: '36px', padding: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWishlist(product.id);
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default WishlistPage;
