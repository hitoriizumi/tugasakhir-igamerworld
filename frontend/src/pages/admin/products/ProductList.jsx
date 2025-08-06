import React, { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosInstance';
import {
  Button, Container, Spinner, Table, Image, Badge, Form, Row, Col, Alert,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import { isAdmin } from '@/utils/authHelper';

const MySwal = withReactContent(Swal);

const ProductList = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    brand_id: '',
    subcategory_id: '',
    category_id: '',
    status_stock: '',
    sort_by: 'latest',
    is_active: '',
    page: 1,
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire('Akses Ditolak!', 'Silakan login sebagai Admin.', 'error')
        .then(() => navigate('/login/admin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();

    return () => {
      stopInactivityTracker();
    };
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        keyword: filters.keyword || undefined,
        brand_id: filters.brand_id || undefined,
        subcategory_id: filters.subcategory_id || undefined,
        category_id: filters.category_id || undefined,
        status_stock: filters.status_stock || undefined,
        is_active: filters.is_active !== '' ? filters.is_active : undefined,
        sort_by: filters.sort_by === 'latest' ? 'newest'
              : filters.sort_by === 'oldest' ? 'oldest'
              : filters.sort_by === 'highest' ? 'price_desc'
              : filters.sort_by === 'lowest' ? 'price_asc'
              : 'newest',
        page: filters.page,
      };

      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
      setPagination({
        current_page: res.data.current_page,
        last_page: res.data.last_page,
      });
    } catch (err) {
      console.error('Gagal memuat produk:', err);
      MySwal.fire('Error!', 'Gagal memuat data produk.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchMetadata = useCallback(async () => {
    try {
      const [catRes, subRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/subcategories'),
        api.get('/brands'),
      ]);
      setCategories(catRes.data.data);
      setSubcategories(subRes.data.data);
      setBrands(brandRes.data.data);
    } catch (err) {
      console.error('Gagal memuat metadata:', err);
      MySwal.fire('Error!', 'Gagal memuat data metadata.', 'error');
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchMetadata();
      fetchProducts();
    }
  }, [isAuthorized, fetchMetadata, fetchProducts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1, // reset ke halaman 1 setiap kali filter berubah
      ...(name === 'category_id' && {
        subcategory_id: '',
        brand_id: '',
      }),
    }));
  };

  const getFilteredSubcategories = () =>
    filters.category_id
      ? subcategories.filter(s => s.category_id === Number(filters.category_id))
      : subcategories;

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      brand_id: '',
      subcategory_id: '',
      category_id: '',
      status_stock: '',
      sort_by: 'latest',
      is_active: '',
      page: 1,
    });
  };

  const handleToggleStatus = async (id, isActive) => {
    const result = await MySwal.fire({
      title: isActive ? 'Nonaktifkan Produk?' : 'Aktifkan Produk?',
      text: isActive
        ? 'Produk akan dinonaktifkan dan tidak tampil di halaman publik.'
        : 'Produk akan diaktifkan dan tampil di halaman publik.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isActive ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/products/${id}/toggle`);
      await fetchProducts();
      MySwal.fire('Berhasil!', 'Status produk telah diperbarui.', 'success');
    } catch (err) {
      console.error('Gagal memperbarui status:', err);
      MySwal.fire('Error!', 'Terjadi kesalahan saat memperbarui status.', 'error');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ready_stock':
        return <Badge bg="success">Ready Stock</Badge>;
      case 'pre_order':
        return <Badge bg="warning">Pre-Order</Badge>;
      case 'out_of_stock':
      default:
        return <Badge bg="secondary">Out of Stock</Badge>;
    }
  };

  if (!isAuthorized) return null;

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h4 className="mb-0 fw-bold">Manajemen Produk</h4>
            <div className="d-flex flex-wrap gap-2">
              <Button as={Link} to="add" variant="primary">+ Tambah Produk</Button>
              <Button as={Link} to="/admin/metadata" variant="outline-secondary">Kelola Metadata</Button>
              <Button as={Link} to="/admin/stock" variant="outline-secondary">Kelola Stok</Button>
              <Button as={Link} to="/admin/compatibilities" variant="outline-secondary">Kelola Kompatibilitas</Button>
            </div>
          </div>

          {/* Filter */}
          <Form onSubmit={handleSearch} className="mb-4">
            <Row className="g-3">
              <Col lg={4}>
                <Form.Label>Cari Produk</Form.Label>
                <Form.Control
                  name="keyword"
                  value={filters.keyword}
                  onChange={handleFilterChange}
                  placeholder="Nama / Brand / Kategori"
                />
              </Col>
              <Col lg={4}>
                <Form.Label>Brand</Form.Label>
                <Form.Select name="brand_id" value={filters.brand_id} onChange={handleFilterChange}>
                  <option value="">Semua</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={4}>
                <Form.Label>Kategori</Form.Label>
                <Form.Select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                  <option value="">Semua</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={4}>
                <Form.Label>Subkategori</Form.Label>
                <Form.Select name="subcategory_id" value={filters.subcategory_id} onChange={handleFilterChange}>
                  <option value="">Semua</option>
                  {getFilteredSubcategories().map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col lg={4}>
                <Form.Label>Status Stok</Form.Label>
                <Form.Select name="status_stock" value={filters.status_stock} onChange={handleFilterChange}>
                  <option value="">Semua</option>
                  <option value="ready">Ready</option>
                  <option value="pre_order">Pre Order</option>
                  <option value="out_of_stock">Out of Stock</option>
                </Form.Select>
              </Col>
              <Col lg={4}>
                <Form.Label>Urutkan</Form.Label>
                <Form.Select name="sort_by" value={filters.sort_by} onChange={handleFilterChange}>
                  <option value="latest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="highest">Harga Tertinggi</option>
                  <option value="lowest">Harga Terendah</option>
                </Form.Select>
              </Col>
              <Col lg={4}>
                <Form.Label>Status Aktif</Form.Label>
                <Form.Select name="is_active" value={filters.is_active} onChange={handleFilterChange}>
                  <option value="">Semua</option>
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </Form.Select>
              </Col>
              <Col lg={2}>
                <Form.Label className="invisible">.</Form.Label>
                <Button type="submit" className="w-100">Filter</Button>
              </Col>
              <Col lg={2}>
                <Form.Label className="invisible">.</Form.Label>
                <Button
                  variant="secondary"
                  className="w-100"
                  onClick={handleResetFilters}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : products.length === 0 ? (
            <Alert variant="warning" className="text-center">Produk tidak tersedia.</Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="text-center">
                  <tr>
                    <th>Gambar</th><th>Nama</th><th>Harga</th><th>Stok</th><th>Status</th>
                    <th>Kategori</th><th>Subkategori</th><th>Brand</th><th>Status</th><th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="text-center align-middle">
                      <td>{product.main_image
                        ? <Image src={product.main_image} height="50" rounded />
                        : <span className="text-muted">Tidak ada</span>}</td>
                      <td>{product.name}</td>
                      <td>Rp {Number(product.price).toLocaleString()}</td>
                      <td>{product.stock}</td>
                      <td>{renderStatusBadge(product.status_stock)}</td>
                      <td>{product.subcategory?.category?.name || '-'}</td>
                      <td>{product.subcategory?.name || '-'}</td>
                      <td>{product.brand?.name || '-'}</td>
                      <td>
                        <Badge bg={product.is_active ? 'success' : 'secondary'}>
                          {product.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </td>
                      <td>
                        <Button as={Link} to={`edit/${product.id}`} size="sm" variant="warning" className="me-2">
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={product.is_active ? 'danger' : 'info'}
                          onClick={() => handleToggleStatus(product.id, product.is_active)}
                        >
                          {product.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {/* Pagination */}
              {pagination && (
                <div className="d-flex justify-content-center gap-3 mt-4 mb-4">
                  <Button
                    disabled={pagination.current_page === 1}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Sebelumnya
                  </Button>
                  <span className="align-self-center fw-semibold">
                    {pagination.current_page} dari {pagination.last_page}
                  </span>
                  <Button
                    disabled={pagination.current_page === pagination.last_page}
                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default ProductList;
