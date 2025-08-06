import React, { useEffect, useState } from 'react';
import {
  Container, Spinner, Button, Form, Row, Col, Alert
} from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/api/axiosInstance';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const EditCompatibility = () => {
  const { id } = useParams();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productRes, allRes, compatRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/products/compatibility/list'),
          api.get(`/products/${id}/compatibilities`)
        ]);

        const mainProduct = productRes.data.data;
        if (!mainProduct) {
          throw new Error('Produk tidak ditemukan.');
        }

        const allKomponen = allRes.data.data.filter(
          p =>
            p.id !== mainProduct.id &&
            p.subcategory?.category?.name?.toLowerCase() === 'komponen'
        );

        setProduct(mainProduct);
        setAllProducts(allKomponen);
        setSelectedIds(compatRes.data.data.map(p => p.id));
      } catch (err) {
        console.error(err);
        MySwal.fire('Gagal!', 'Gagal memuat data kompatibilitas.', 'error')
          .then(() => navigate('/admin/compatibilities'));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthorized) fetchData();
  }, [id, isAuthorized, navigate]);

  const handleCheckboxChange = (productId) => {
    setSelectedIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/compatibilities', {
        product_id: product.id,
        compatible_ids: selectedIds
      });
      MySwal.fire('Berhasil!', 'Kompatibilitas berhasil disimpan.', 'success');
    } catch (err) {
      console.error(err);
      MySwal.fire('Gagal!', 'Gagal menyimpan kompatibilitas.', 'error');
    }
  };

  const filteredProducts = allProducts.filter(p => {
    const keywordMatch = p.name.toLowerCase().includes(filterKeyword.toLowerCase());
    const subcategoryMatch = !filterSubcategory || p.subcategory?.id === Number(filterSubcategory);
    return keywordMatch && subcategoryMatch;
  });

  const subcategoryOptions = [
    ...new Map(allProducts.map(p => [p.subcategory?.id, p.subcategory?.name])).entries()
  ];

  if (!isAuthorized) return null;

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h4 className="mb-0 fw-bold">Kelola Kompatibilitas: {product?.name}</h4>
            <Button as={Link} to="/admin/compatibilities" variant="secondary">
              ← Kembali
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : (
            <>
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3 g-3">
                  <Col lg={6}>
                    <Form.Control
                      type="text"
                      placeholder="Cari produk berdasarkan nama..."
                      value={filterKeyword}
                      onChange={(e) => setFilterKeyword(e.target.value)}
                    />
                  </Col>
                  <Col lg={6}>
                    <Form.Select
                      value={filterSubcategory}
                      onChange={(e) => setFilterSubcategory(e.target.value)}
                    >
                      <option value="">Semua Subkategori</option>
                      {subcategoryOptions.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </Form.Select>
                  </Col>
                </Row>

                {filteredProducts.length === 0 ? (
                  <Alert variant="warning">Tidak ada produk ditemukan.</Alert>
                ) : (
                  <div className="border rounded p-3 mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredProducts.map(p => (
                      <Form.Check
                        key={p.id}
                        type="checkbox"
                        id={`product-${p.id}`}
                        label={`${p.name} — ${p.brand?.name} — ${p.subcategory?.name}`}
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleCheckboxChange(p.id)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                )}

                <Button type="submit" variant="primary">Simpan Kompatibilitas</Button>
              </Form>
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default EditCompatibility;
