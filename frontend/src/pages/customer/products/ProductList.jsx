import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, Pagination, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authhelper';

const ProductList = () => {
  const navigate = useNavigate();

  const [products, setProducts] = useState({ data: [], current_page: 1, last_page: 1 });
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cartProductIds, setCartProductIds] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const location = useLocation();

  const [filters, setFilters] = useState({
    keyword: '',
    category_id: '',
    subcategory_id: '',
    brand_id: '',
    status_stock: '',
    sort: 'newest',
  });

  const fetchFilters = useCallback(async () => {
    try {
      const [catRes, subRes, brandRes] = await Promise.all([
        api.get('/public/categories'),
        api.get('/public/subcategories'),
        api.get('/public/brands'),
      ]);
      setCategories(catRes.data.data);
      setSubcategories(subRes.data.data);
      setBrands(brandRes.data.data);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await api.get('/public/products', {
        params: { ...filters, page: currentPage },
      });
      setProducts(res.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingProducts(false); // ✅ Selesai loading
    }
  }, [filters, currentPage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const keywordFromQuery = params.get('search');
    const categoryIdFromQuery = params.get('category_id');
    const brandIdFromQuery = params.get('brand_id');
    const subcategoryIdFromQuery = params.get('subcategory_id');

    setFilters((prev) => ({
      ...prev,
      keyword: keywordFromQuery || '',
      category_id: categoryIdFromQuery || '',
      brand_id: brandIdFromQuery || '',
      subcategory_id: subcategoryIdFromQuery || '',
    }));
  }, [location.search]);

  useEffect(() => {
    AOS.init({ duration: 800 });
    fetchFilters();
  }, [fetchFilters]);

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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (product) => {
    if (!isCustomer()) {
      Swal.fire('Harus Login', 'Silakan login sebagai pelanggan terlebih dahulu.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    // Tidak bisa tambahkan produk out of stock
    if (product.status_stock === 'out_of_stock') {
      Swal.fire('Produk Habis', 'Produk sudah habis, cari yang lain yuk!', 'info');
      return;
    }

    // Cek apakah produk sudah ada di keranjang
    if (cartProductIds.includes(product.id)) {
      Swal.fire('Sudah Ada', 'Produk sudah ada di keranjang.', 'info');
      return;
    }

    try {
      await api.post('/cart', {
        product_id: product.id,
        quantity: 1
      });

      setCartProductIds(prev => [...prev, product.id]); // update lokal cart id
      Swal.fire('Berhasil', 'Produk ditambahkan ke keranjang.', 'success');
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

  const filteredSubcategories = filters.category_id
    ? subcategories.filter(s => s.category.id === parseInt(filters.category_id))
    : subcategories;

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= products.last_page) {
      setCurrentPage(pageNumber);
    }
  };

  const readyAndPreOrder = products.data.filter(
    p => p.status_stock === 'ready_stock' || p.status_stock === 'pre_order'
  );
  const outOfStock = products.data.filter(p => p.status_stock === 'out_of_stock');
  const sortedProducts = [...readyAndPreOrder, ...outOfStock];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white', margin: '0 auto' }}>
        <div className="d-block d-lg-none mb-3 text-center">
          <Button variant="outline-light" size="sm" onClick={() => setShowFilter(!showFilter)}>
            {showFilter ? 'Tutup Filter' : 'Tampilkan Filter'}
          </Button>
        </div>
          <Row>
            {/* Sidebar Filter */}
            <Col lg={3} className={`mb-4 ${showFilter ? '' : 'd-none d-lg-block'}`}>
              <h5 className="mb-3">Filter Produk</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Produk</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Cari produk..."
                    value={filters.keyword}
                    onChange={e => setFilters({ ...filters, keyword: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={filters.category_id}
                    onChange={e => setFilters({ ...filters, category_id: e.target.value, subcategory_id: '' })}
                  >
                    <option value="">Semua</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Subkategori</Form.Label>
                  <Form.Select
                    value={filters.subcategory_id}
                    onChange={e => setFilters({ ...filters, subcategory_id: e.target.value })}
                  >
                    <option value="">Semua</option>
                    {filteredSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Select
                    value={filters.brand_id}
                    onChange={e => setFilters({ ...filters, brand_id: e.target.value })}
                  >
                    <option value="">Semua</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Status Stok</Form.Label>
                  <Form.Select
                    value={filters.status_stock}
                    onChange={e => setFilters({ ...filters, status_stock: e.target.value })}
                  >
                    <option value="">Semua</option>
                    <option value="ready_stock">Ready Stock</option>
                    <option value="pre_order">Pre-Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Urutkan</Form.Label>
                  <Form.Select
                    value={filters.sort}
                    onChange={e => setFilters({ ...filters, sort: e.target.value })}
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="price_asc">Harga Termurah</option>
                    <option value="price_desc">Harga Tertinggi</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Col>

            {/* Produk Grid */}
            <Col lg={9}>
              {loadingProducts ? (
                <div className="text-center py-5 w-100">
                  <Spinner animation="border" variant="light" />
                </div>
              ) : (
                <>
                  <Row>
                    {products.data.length === 0 ? (
                      <div
                        className="d-flex flex-column align-items-center justify-content-center w-100"
                        style={{ minHeight: '100vh', textAlign: 'center' }}
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
                      sortedProducts.map(product => (
                        <Col key={product.id} xs={12} sm={6} md={4} xl={3} xxl={2} className="mb-4">
                          <Card
                            className="h-100"
                            style={{ backgroundColor: '#2C2C2C', color: 'white', cursor: 'pointer' }}
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
                                    textOverflow: 'ellipsis'
                                  }}
                                  title={product.name}
                                >
                                  {product.name}
                                </div>

                                <div style={{ fontSize: '0.85rem', color: '#FFD700', fontWeight: '600' }}>
                                  {formatCurrency(product.price)}
                                </div>

                                <div style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>
                                  {product.brand?.name}
                                </div>

                                {renderBadge(product.status_stock)}
                              </div>
                              <div className="mt-4 d-flex justify-content-between">
                                <Button
                                  variant="outline-light"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(product);
                                  }}
                                >
                                  🛒
                                </Button>
                                <Button
                                  variant="outline-light"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToWishlist(product);
                                  }}
                                >
                                  ❤️
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))
                    )}
                  </Row>

                  {/* Pagination */}
                  {products.last_page > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <Pagination>
                        {[...Array(products.last_page)].map((_, idx) => (
                          <Pagination.Item
                            key={idx + 1}
                            active={currentPage === idx + 1}
                            onClick={() => handlePageChange(idx + 1)}
                          >
                            {idx + 1}
                          </Pagination.Item>
                        ))}
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>
      <FooterCustomer />
    </>

  );
};

export default ProductList;
