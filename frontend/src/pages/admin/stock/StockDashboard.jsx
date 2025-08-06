import React, { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosInstance';
import {
  Container, Table, Form, Button, Spinner, Badge, Row, Col, Image, Alert,
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const StockDashboard = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    brand_id: '',
    subcategory_id: '',
    category_id: '',
    status_stock: '',
    is_active: 1,
  });

  const [brands, setBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Admin.',
        icon: 'error',
      }).then(() => navigate('/login/admin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();
    return () => stopInactivityTracker();
  }, [navigate]);

  const fetchFilters = useCallback(async () => {
    try {
      const [brandsRes, subcategoriesRes, categoriesRes] = await Promise.all([
        api.get('/brands'),
        api.get('/subcategories'),
        api.get('/categories'),
      ]);
      setBrands(brandsRes.data.data);
      setSubcategories(subcategoriesRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (error) {
      console.error('Error fetching filter data:', error);
      MySwal.fire('Gagal', 'Tidak dapat memuat data filter', 'error');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          ...filters,
          page: currentPage
        }
      });
      setProducts(res.data.data);
      setTotalPages(res.data.last_page); // total halaman
    } catch (error) {
      console.error('Error fetching products:', error);
      MySwal.fire('Gagal', 'Tidak dapat memuat produk', 'error');
    }
    setLoading(false);
  }, [filters, currentPage]);


  useEffect(() => {
    if (isAuthorized) {
      fetchFilters();
    }
  }, [isAuthorized, fetchFilters]);

  useEffect(() => {
    if (isAuthorized) {
      fetchProducts();
    }
  }, [isAuthorized, fetchProducts, currentPage]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'category_id' && { subcategory_id: '' }),
    }));
    setCurrentPage(1); // reset page ke 1
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      brand_id: '',
      subcategory_id: '',
      category_id: '',
      status_stock: '',
      is_active: 1,
    });
    setCurrentPage(1);
  };

  const getFilteredSubcategories = () => {
    return filters.category_id
      ? subcategories.filter(sub => sub.category_id === Number(filters.category_id))
      : subcategories;
  };

  const getCategoryName = (subcategory) => {
    return subcategory?.category?.name || '-';
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ready_stock':
        return <Badge bg="success">Ready Stock</Badge>;
      case 'pre_order':
        return <Badge bg="info">Pre-Order</Badge>;
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
          <h4 className="mb-4 fw-bold">Manajemen Stok Produk</h4>

          <Row className="mb-3 g-3 align-items-end">
            <Col lg={4}>
              <Form.Control
                placeholder="Cari nama produk..."
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
              />
            </Col>
            <Col lg={2}>
              <Form.Select name="category_id" value={filters.category_id} onChange={handleFilterChange}>
                <option value="">Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col lg={2}>
              <Form.Select name="subcategory_id" value={filters.subcategory_id} onChange={handleFilterChange}>
                <option value="">Subkategori</option>
                {getFilteredSubcategories().map((sub) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col lg={2}>
              <Form.Select name="brand_id" value={filters.brand_id} onChange={handleFilterChange}>
                <option value="">Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col lg={2}>
              <Form.Select name="status_stock" value={filters.status_stock} onChange={handleFilterChange}>
                <option value="">Status Stok</option>
                <option value="ready_stock">Ready Stock</option>
                <option value="pre_order">Pre-Order</option>
                <option value="out_of_stock">Out of Stock</option>
              </Form.Select>
            </Col>
            <Col lg="auto">
              <div className="d-flex gap-2">
                <Button onClick={handleSearch}>Filter</Button>
                <Button variant="secondary" onClick={handleResetFilters}>Reset</Button>
              </div>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : products.length === 0 ? (
            <Alert variant="warning" className="text-center">Produk tidak ditemukan.</Alert>
          ) : (
            <div className="table-responsive">
              <Table bordered hover>
                <thead className="text-center">
                  <tr>
                    <th>Gambar</th>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Brand</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="text-center align-middle">
                      <td>
                        {product.main_image ? (
                          <Image src={product.main_image} alt="product" width={60} height={60} rounded />
                        ) : (
                          <span className="text-muted">Tidak ada</span>
                        )}
                      </td>
                      <td>{product.name}</td>
                      <td>{getCategoryName(product.subcategory)}</td>
                      <td>{product.brand?.name || '-'}</td>
                      <td>{product.stock}</td>
                      <td>{renderStatusBadge(product.status_stock)}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => navigate(`/admin/stock/${product.id}`)}
                        >
                          Kelola Stok
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {products.length > 0 && (
                <div className="d-flex justify-content-center gap-3 mt-4 mb-4">
                  <Button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Sebelumnya
                  </Button>
                  <span className="mx-3 align-self-center">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
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

export default StockDashboard;
