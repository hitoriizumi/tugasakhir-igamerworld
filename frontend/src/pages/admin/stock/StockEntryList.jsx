import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import {
  Container,
  Card,
  Row,
  Col,
  Image,
  Table,
  Button,
  Spinner,
  Modal,
  Form,
  Badge,
  Alert,
} from 'react-bootstrap';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import { isAdmin } from '@/utils/authHelper';

const MySwal = withReactContent(Swal);

const StockEntryList = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [product, setProduct] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: 'in', quantity: '', note: '' });
  const [saving, setSaving] = useState(false);

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

  const fetchProductAndEntries = useCallback(async () => {
    setLoading(true);
    try {
      const [productRes, entriesRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get(`/stock-entries/${productId}`),
      ]);

      setProduct(productRes.data.data);
      setEntries(entriesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      MySwal.fire('Gagal', 'Tidak dapat memuat data produk atau entri stok', 'error');
    }
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    if (isAuthorized) {
      fetchProductAndEntries();
    }
  }, [isAuthorized, fetchProductAndEntries]);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stock-entries', {
        product_id: productId,
        ...form,
      });
      MySwal.fire('Berhasil', 'Entri stok berhasil ditambahkan', 'success');
      setShowModal(false);
      setForm({ type: 'in', quantity: '', note: '' });
      fetchProductAndEntries();
    } catch (error) {
      MySwal.fire('Gagal', error.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
    setSaving(false);
  };

  const handleDeleteEntry = async (entryId) => {
    const confirm = await MySwal.fire({
      title: 'Hapus Entri?',
      text: 'Stok akan disesuaikan kembali.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/stock-entries/${entryId}`);
        MySwal.fire('Berhasil', 'Entri stok dihapus.', 'success');
        fetchProductAndEntries();
      } catch (err) {
        MySwal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus entri', 'error');
      }
    }
  };

  if (!isAuthorized || loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <DashboardNavbar redirectLogout="/login/admin" />
      <DashboardSidebar />
      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <h4 className="mb-4 fw-bold">Histori Stok Produk</h4>

          {product ? (
            <>
              <Card className="mb-4">
                <Card.Body>
                  <Row>
                    <Col md={2}>
                      <Image src={product.main_image} alt="product" thumbnail fluid />
                    </Col>
                    <Col>
                      <h5>{product.name}</h5>
                      <p>Kategori: {product.subcategory?.category?.name || '-'}</p>
                      <p>Subkategori: {product.subcategory?.name || '-'}</p>
                      <p>Brand: {product.brand?.name || '-'}</p>
                      <p>Stok saat ini: <strong>{product.stock}</strong></p>
                      <p>Status: <Badge bg={
                        product.status_stock === 'ready_stock' ? 'success'
                          : product.status_stock === 'pre_order' ? 'info'
                          : 'secondary'
                      }>
                        {product.status_stock.replace('_', ' ')}
                      </Badge></p>
                    </Col>
                    <Col md="auto">
                      <Button onClick={() => setShowModal(true)}>Tambah Entri Stok</Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <h5 className="mb-3">Riwayat Stok</h5>
              {entries.length === 0 ? (
                <Alert variant="warning" className="text-center">Belum ada entri stok untuk produk ini.</Alert>
              ) : (
                <div className="table-responsive">
                  <Table bordered hover>
                    <thead className="text-center">
                      <tr>
                        <th>Tanggal</th>
                        <th>Jenis</th>
                        <th>Jumlah</th>
                        <th>Catatan</th>
                        <th>Admin</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="text-center align-middle">
                          <td>{new Date(entry.created_at).toLocaleString()}</td>
                          <td>
                            <Badge bg={entry.type === 'in' ? 'success' : 'danger'}>
                              {entry.type === 'in' ? 'Masuk' : 'Keluar'}
                            </Badge>
                          </td>
                          <td>{entry.quantity}</td>
                          <td>{entry.note || '-'}</td>
                          <td>{entry.user?.name || '-'}</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              Hapus
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          ) : (
            <Alert variant="danger">Produk tidak ditemukan.</Alert>
          )}

          {/* Modal Tambah Entri */}
          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Tambah Entri Stok</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
              <Modal.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Jenis</Form.Label>
                  <Form.Select name="type" value={form.type} onChange={handleInputChange} required>
                    <option value="in">Masuk</option>
                    <option value="out">Keluar</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Jumlah</Form.Label>
                  <Form.Control
                    type="number"
                    name="quantity"
                    value={form.quantity}
                    onChange={handleInputChange}
                    required
                    min={1}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Catatan (Opsional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="note"
                    rows={3}
                    value={form.note}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button variant="primary" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default StockEntryList;
