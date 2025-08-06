import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Image, Badge, Spinner,
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authhelper';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);
  const [cartProductIds, setCartProductIds] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [similarByName, setSimilarByName] = useState([]);
  const [similarByBrand, setSimilarByBrand] = useState([]);
  const [similarBySubcategory, setSimilarBySubcategory] = useState([]);
  // const scrollRefName = useRef(null);
  // const scrollRefBrand = useRef(null);
  // const scrollRefSubcategory = useRef(null);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await api.get(`/public/products/${id}`);
      const data = res.data.data;
      setProduct(data);
      console.log('product:', data);
      console.log('images:', data.images);
      setMainImage(data.main_image);
    } catch (error) {
      console.error('Failed to fetch product detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAllSimilar = useCallback(async () => {
    try {
      const [nameRes, brandRes, subcatRes] = await Promise.all([
        api.get(`/public/products/${id}/similar/name`),
        api.get(`/public/products/${id}/similar/brand`),
        api.get(`/public/products/${id}/similar/subcategory`)
      ]);
      setSimilarByName(nameRes.data.data);
      setSimilarByBrand(brandRes.data.data);
      setSimilarBySubcategory(subcatRes.data.data);
    } catch (error) {
      console.error('Failed to fetch similar products:', error);
    }
  }, [id]);


  useEffect(() => {
    AOS.init({ duration: 800 });
    fetchProduct();
    fetchAllSimilar();
  }, [fetchProduct, fetchAllSimilar]);

  useEffect(() => {
    if (isCustomer()) {
      api.get('/cart')
        .then(res => {
          const ids = res.data.data.map(item => item.product.id);
          setCartProductIds(ids);
        })
        .catch(() => {
          Swal.fire('Oops!', 'Gagal memuat data keranjang.', 'error');
        });

      api.get('/wishlist')
        .then(res => {
          const ids = res.data.data.map(item => item.product.id);
          setWishlistProductIds(ids);
        })
        .catch(() => {
          Swal.fire('Oops!', 'Gagal memuat data wishlist.', 'error');
        });
    }
  }, [id]);

  // const scrollLeft = (ref) => {
  //   if (ref.current) {
  //     ref.current.scrollBy({ left: -300, behavior: 'smooth' });
  //   }
  // };

  // const scrollRight = (ref) => {
  //   if (ref.current) {
  //     ref.current.scrollBy({ left: 300, behavior: 'smooth' });
  //   }
  // };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const renderBadge = (status) => {
    switch (status) {
      case 'ready_stock':
        return <Badge bg="success">Ready Stock</Badge>;
      case 'pre_order':
        return <Badge bg="warning" text="dark">Pre-Order</Badge>;
      case 'out_of_stock':
        return <Badge bg="secondary">Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const handleAddToCart = async () => {
    if (!isCustomer()) {
      Swal.fire('Harus Login', 'Silakan login sebagai pelanggan terlebih dahulu.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    if (product.status_stock === 'out_of_stock') {
      Swal.fire('Stok Habis', 'Untuk sementara barang habis. Kamu bisa wishlist barang ini atau cari barang serupa.', 'info');
      return;
    }

    if (cartProductIds.includes(product.id)) {
      Swal.fire('Sudah Ada di Keranjang', 'Produk sudah ada di keranjang kamu.', 'info');
      return;
    }

    try {
      await api.post('/cart', {
        product_id: product.id,
        quantity: 1,
      });

      Swal.fire('Berhasil', 'Produk ditambahkan ke keranjang.', 'success');
      setCartProductIds([...cartProductIds, product.id]);
    } catch (error) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan saat menambahkan ke keranjang.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!isCustomer()) {
      Swal.fire('Harus Login', 'Silakan login sebagai pelanggan terlebih dahulu.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    if (wishlistProductIds.includes(product.id)) {
      if (product.status_stock === 'out_of_stock') {
        Swal.fire('Barang Habis', 'Barang ini habis, ditunggu yah 🕒', 'info');
      } else {
        Swal.fire('Sudah Ada', 'Produk sudah ada di wishlist.', 'info');
      }
      return;
    }

    try {
      await api.post('/wishlist', { product_id: product.id });
      setWishlistProductIds(prev => [...prev, product.id]);
      Swal.fire('Berhasil', 'Produk ditambahkan ke wishlist.', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || 'Terjadi kesalahan saat menambahkan ke wishlist.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  const handleImageChange = (url) => {
    setFade(false); // reset animasi
    setTimeout(() => {
      setMainImage(url);
      setFade(true); // trigger fade
    }, 50);
  };


  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white', margin: '0 auto' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="light" />
            </div>
          ) : product ? (
            <>
              {/* Produk Detail */}
              <Row className="mb-5">
                {/* Gambar */}
                <Col md={6} className="mb-4">
                  <div>
                    {/* MAIN IMAGE */}
                    <div className="text-center mb-3">
                      <div style={{ width: '100%', maxWidth: '80%', height: '500px', margin: '0 auto' }}>
                        <Image
                          src={mainImage}
                          fluid
                          className={fade ? 'fade-in' : ''}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      </div>
                    </div>

                    {/* THUMBNAIL PREVIEW */}
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      {[product.main_image, ...product.images.map(img => img.image_url)]
                        // Hilangkan duplikat URL gambar
                        .filter((url, idx, arr) => arr.indexOf(url) === idx)
                        .map((url, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '70px',
                              height: '70px',
                              border: mainImage === url ? '2px solid #ffc107' : '1px solid #ccc',
                              borderRadius: '5px',
                              overflow: 'hidden',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleImageChange(url)}
                          >
                            <Image
                              src={url}
                              alt={`Thumbnail ${idx}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </Col>

                {/* Info Produk */}
                <Col md={6}>
                  <div className="mb-2 d-flex flex-wrap gap-2">
                    {renderBadge(product.status_stock)}
                  </div>
                  <h4 className="fw-bold">{product.name}</h4>
                  <hr style={{ borderColor: 'white' }} />
                  <p className="mb-1 text-decoration-line-through text-muted">
                    {product.original_price ? formatCurrency(product.original_price) : ''}
                  </p>
                  <p className="mb-1 text-muted">
                    {product.status_stock === 'pre_order' && (
                      <div className="alert alert-warning mt-3" style={{ fontSize: '0.9rem' }}>
                        Perkiraan waktu tiba menyesuaikan dari waktu pemesanan. Hubungi admin untuk estimasi lebih lanjut.
                      </div>
                    )}
                  </p>
                  <h5 className="text-warning">{formatCurrency(product.price)}</h5>

                  {product.status_stock === 'out_of_stock' && (
                    <div className="alert alert-secondary mt-3" style={{ fontSize: '0.9rem' }}>
                      Untuk sementara barang habis. Kamu bisa wishlist barang ini atau cari barang serupa.
                    </div>
                  )}

                  <div className="d-flex gap-3 align-items-center mt-3">
                    <Button
                      className="border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart();
                      }}
                      style={{
                        backgroundColor: '#ffc107',
                        color: 'black'
                      }}
                    >
                      Tambahkan ke Keranjang
                    </Button>
                    <Button
                      className="border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWishlist(product);
                      }}
                      style={{
                        backgroundColor: '#b62000',
                        color: 'white'
                      }}
                    >
                      Tambahkan ke Wishlist
                    </Button>
                  </div>

                  <div className="mt-4">
                    <p><strong>Kategori:</strong> {product.subcategory?.category?.name}</p>
                    <p><strong>Subkategori:</strong> {product.subcategory?.name}</p>
                    <p><strong>Brand:</strong> {product.brand?.name}</p>
                    <div
                      dangerouslySetInnerHTML={{ __html: product.description }}
                      style={{ lineHeight: '1.6', marginTop: '10px' }}
                    />
                  </div>
                </Col>
              </Row>

              {/* Produk Serupa Berdasarkan Nama */}
              <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                <h5 className="mb-0">Produk Serupa Berdasarkan Nama</h5>
                {similarByName.length >= 12 && (
                  <span
                    onClick={() => navigate('/produk')}
                    style={{ cursor: 'pointer', color: '#0d6efd', fontSize: '0.9rem' }}
                  >
                    Lihat Semua →
                  </span>
                )}
              </div>

              <Row className="g-3">
                {similarByName.map((product) => (
                  <Col key={product.id} xs={6} sm={4} md={3} lg={2}>
                    <Card
                      className="h-100"
                      style={{
                        backgroundColor: '#2C2C2C',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/produk/${product.id}`)}
                    >
                      <div style={{ height: '180px', overflow: 'hidden' }}>
                        <Card.Img
                          variant="top"
                          src={product.main_image || '/image/default-product.png'}
                          alt={product.name}
                          loading="lazy"
                          style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                        />
                      </div>
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: 'white',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={product.name}
                          >
                            {product.name}
                          </div>

                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: '#FFD700',
                              fontWeight: '600',
                            }}
                          >
                            {formatCurrency(product.price)}
                          </div>

                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#AAAAAA',
                            }}
                          >
                            {product.brand?.name}
                          </div>

                          {renderBadge(product.status_stock)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Produk dari Brand yang Sama */}
              <div className="d-flex justify-content-between align-items-center mt-5 mb-3">
                <h5 className="mb-0">Produk dari Brand yang Sama</h5>
                {similarByBrand.length >= 12 && (
                  <span
                    onClick={() => navigate('/produk')}
                    style={{ cursor: 'pointer', color: '#0d6efd', fontSize: '0.9rem' }}
                  >
                    Lihat Semua →
                  </span>
                )}
              </div>

              <Row className="g-3">
                {similarByBrand.map((product) => (
                  <Col key={product.id} xs={6} sm={4} md={3} lg={2}>
                    <Card
                      className="h-100"
                      style={{
                        backgroundColor: '#2C2C2C',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/produk/${product.id}`)}
                    >
                      <div style={{ height: '180px', overflow: 'hidden' }}>
                        <Card.Img
                          variant="top"
                          src={product.main_image || '/image/default-product.png'}
                          alt={product.name}
                          loading="lazy"
                          style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                        />
                      </div>
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: 'white',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={product.name}
                          >
                            {product.name}
                          </div>

                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: '#FFD700',
                              fontWeight: '600',
                            }}
                          >
                            {formatCurrency(product.price)}
                          </div>

                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#AAAAAA',
                            }}
                          >
                            {product.brand?.name}
                          </div>

                          {renderBadge(product.status_stock)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Produk dalam Subkategori yang Sama */}
              <div className="d-flex justify-content-between align-items-center mt-5 mb-3">
                <h5 className="mb-0">Produk dalam Subkategori yang Sama</h5>
                {similarBySubcategory.length >= 12 && (
                  <span
                    onClick={() => navigate('/produk')}
                    style={{ cursor: 'pointer', color: '#0d6efd', fontSize: '0.9rem' }}
                  >
                    Lihat Semua →
                  </span>
                )}
              </div>

              <Row className="g-3">
                {similarBySubcategory.map((product) => (
                  <Col key={product.id} xs={6} sm={4} md={3} lg={2}>
                    <Card
                      className="h-100"
                      style={{
                        backgroundColor: '#2C2C2C',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/produk/${product.id}`)}
                    >
                      <div style={{ height: '180px', overflow: 'hidden' }}>
                        <Card.Img
                          variant="top"
                          src={product.main_image || '/image/default-product.png'}
                          alt={product.name}
                          loading="lazy"
                          style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                        />
                      </div>
                      <Card.Body className="d-flex flex-column justify-content-between">
                        <div>
                          <div
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: 'white',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={product.name}
                          >
                            {product.name}
                          </div>

                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: '#FFD700',
                              fontWeight: '600',
                            }}
                          >
                            {formatCurrency(product.price)}
                          </div>

                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#AAAAAA',
                            }}
                          >
                            {product.brand?.name}
                          </div>

                          {renderBadge(product.status_stock)}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <div className="text-center py-5">
              <p>Produk tidak ditemukan.</p>
            </div>
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default ProductDetail;
