import React, { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosInstance';
import {
  Container, Table, Spinner, Button, Form, Row, Col, Alert, Image
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const CompatibilityManager = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
    
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', {
        params: {
          keyword: keyword || undefined,
          is_active: 1,
          category: 'komponen',
          page: currentPage,
        },
      });

      // const filtered = res.data.data.filter(
      //   p => p.subcategory?.category?.name?.toLowerCase() === 'komponen'
      // );
      // setProducts(filtered);
      setProducts(res.data.data);
      setTotalPages(res.data.last_page); // ← penting!
    } catch (err) {
      console.error('Gagal memuat produk:', err);
      MySwal.fire('Error!', 'Gagal memuat data produk.', 'error');
    } finally {
      setLoading(false);
    }
  }, [keyword, currentPage]);


  useEffect(() => {
    if (isAuthorized) fetchProducts();
  }, [isAuthorized, currentPage, fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
    setCurrentPage(1);
  };

  if (!isAuthorized) return null;

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h4 className="mb-0 fw-bold">Manajemen Kompatibilitas Produk</h4>
          </div>

          {/* Filter */}
          <Form onSubmit={handleSearch} className="mb-4">
            <Row className="g-3">
              <Col lg={6}>
                <Form.Label>Cari Produk</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nama produk"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </Col>
              <Col lg={2}>
                <Form.Label className="invisible">.</Form.Label>
                <Button type="submit" className="w-100">Cari</Button>
              </Col>
            </Row>
          </Form>

          {/* Table */}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : products.length === 0 ? (
            <Alert variant="warning" className="text-center">Tidak ada produk komponen yang aktif.</Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="text-center">
                  <tr>
                    <th>Gambar</th>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Subkategori</th>
                    <th>Brand</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="text-center align-middle">
                      <td>
                        {product.main_image ? (
                          <Image src={product.main_image} height="50" rounded />
                        ) : (
                          <span className="text-muted">Tidak ada</span>
                        )}
                      </td>
                      <td>{product.name}</td>
                      <td>{product.subcategory?.category?.name || '-'}</td>
                      <td>{product.subcategory?.name || '-'}</td>
                      <td>{product.brand?.name || '-'}</td>
                      <td>
                        <Button
                          as={Link}
                          to={`/admin/compatibilities/edit/${product.id}`}
                          size="sm"
                          variant="primary"
                        >
                          Kelola
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="d-flex justify-content-center gap-3 mt-4 mb-4">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="me-2"
                >
                  Sebelumnya
                </Button>
                <span>Halaman {currentPage} dari {totalPages}</span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="ms-2"
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default CompatibilityManager;
