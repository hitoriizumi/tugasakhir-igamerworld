import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Table, Spinner, Badge, Button, Card, Modal, Form
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const OrderCustomPCDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('approve');
  const [note, setNote] = useState('');
  const [shippingCost, setShippingCost] = useState('');

  const fetchOrderDetail = useCallback(async () => {
    try {
      const res = await api.get(`/orders/admin/custom-pc/${id}`);
      setOrder(res.data.data);
    } catch {
      MySwal.fire('Error', 'Gagal memuat detail pesanan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire('Akses Ditolak', 'Halaman ini hanya untuk Admin.', 'warning')
        .then(() => navigate('/login/admin'));
      return;
    }

    startInactivityTracker();
    fetchOrderDetail();

    return () => stopInactivityTracker();
  }, [navigate, fetchOrderDetail]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const statusVariant = {
    menunggu_verifikasi: 'warning',
    menunggu_pembayaran: 'secondary',
    diproses: 'primary',
    dikirim: 'info',
    selesai: 'success',
    dibatalkan: 'danger',
    gagal: 'danger'
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setNote('');
    setShippingCost('');
    setShowModal(true);
  };

  const handleSubmitStatusChange = async () => {
    const newStatus = modalType === 'approve' ? 'menunggu_pembayaran' : 'dibatalkan';

    const payload = { status: newStatus };

    if (modalType === 'approve') {
      const pickupMethod = order?.order_delivery?.pickup_method;

      if (pickupMethod === 'kirim') {
        if (!shippingCost) {
          MySwal.fire('Ongkos Kirim Kosong', 'Harap isi ongkos kirim terlebih dahulu.', 'warning');
          return;
        }
        payload.shipping_cost = shippingCost;
      }
    } else {
      payload.note = note;
    }

    try {
      await api.patch(`/orders/admin/custom-pc/${order.id}/update-status`, payload);
      setShowModal(false);
      MySwal.fire('Berhasil', `Pesanan berhasil di${modalType === 'approve' ? 'setujui' : 'tolak'}.`, 'success');
      fetchOrderDetail();
    } catch {
      MySwal.fire('Gagal', 'Terjadi kesalahan saat memperbarui status.', 'error');
    }
  };

  if (!isAdmin()) return null;

  const components = order?.custom_p_c_order?.custom_pc_components || [];
  const buildFee = Number(order?.custom_p_c_order?.build_fee || 0);

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: 80, paddingTop: 90, minHeight: '100vh' }}>
        <Container>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              <h4 className="fw-bold mb-4">Detail Pesanan Perakitan PC</h4>

              <Card className="mb-4 p-3">
                <Row>
                  <Col md={6}>
                    <p><strong>Invoice:</strong> {order.invoice_number}</p>
                    <p><strong>Tanggal:</strong> {formatDate(order.created_at)}</p>
                    <p><strong>Status:</strong>{' '}
                      <Badge bg={statusVariant[order.order_status]}>
                        {order.order_status.replace(/_/g, ' ')}
                      </Badge>
                    </p>
                    <p><strong>Ongkos Kirim:</strong> {formatCurrency(order.order_delivery?.shipping_cost || 0)}</p>
                    <p><strong>Biaya Rakit:</strong> {formatCurrency(buildFee)}</p>
                    <p><strong>Total Harga:</strong> {formatCurrency(order.total_price)}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Pelanggan:</strong> {order.user?.name}</p>
                    <p><strong>Kurir:</strong> {order.courier?.name || '-'}</p>
                    <p><strong>Metode Pembayaran:</strong> {order.payment_method?.bank_name || '-'}</p>
                    <p><strong>Alamat Pengiriman:</strong> {order.shipping_address?.full_address || '-'}</p>
                    <p><strong>Metode Pengambilan:</strong> {order.order_delivery?.pickup_method || '-'}</p>
                  </Col>
                </Row>
              </Card>

              <Card className="mb-4 p-3">
                <h5 className="mb-3">Komponen Rakitan</h5>
                <Table bordered responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Produk</th>
                      <th>Harga</th>
                      <th>Jumlah</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.product?.name || '-'}</td>
                        <td>{formatCurrency(item.product?.price || 0)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency((item.product?.price || 0) * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>

              {order.order_notes?.length > 0 && (
                <Card className="mb-4 p-3">
                  <h5 className="mb-2">Catatan</h5>
                  {order.order_notes.map((note, i) => {
                    const user = note.user;
                    const role =
                      user?.role_id === 2 ? 'Admin' :
                      user?.role_id === 3 ? 'Pelanggan' : 'Superadmin';
                    return (
                      <p key={i} className="mb-1">
                        <strong>{role} - {user?.name}:</strong> {note.note}
                      </p>
                    );
                  })}
                </Card>
              )}

              <div className="d-flex flex-wrap gap-3 justify-content-end">
                {order.order_status === 'menunggu_verifikasi' && (
                  <>
                    <Button variant="danger" onClick={() => handleOpenModal('reject')}>
                      Tolak Pesanan
                    </Button>
                    <Button variant="success" onClick={() => handleOpenModal('approve')}>
                      Setujui Pesanan
                    </Button>
                  </>
                )}

                <Button
                  variant="primary"
                  onClick={() => navigate(`/admin/orders/custompc/${order.id}/payment`)}
                  title="Lihat konfirmasi pembayaran"
                >
                  Lihat Konfirmasi Pembayaran
                </Button>

                <Button
                  variant="info"
                  onClick={() => navigate(`/admin/orders/custompc/${order.id}/delivery`)}
                  disabled={['menunggu_verifikasi', 'menunggu_pembayaran', 'gagal'].includes(order.order_status)}
                  title={
                    ['menunggu_verifikasi', 'menunggu_pembayaran', 'gagal'].includes(order.order_status)
                      ? 'Belum dapat dikelola. Menunggu proses sebelumnya.'
                      : 'Kelola pengiriman'
                  }
                >
                  Kelola Pengiriman
                </Button>
              </div>

              <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                  <Modal.Title>{modalType === 'approve' ? 'Setujui Pesanan' : 'Tolak Pesanan'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {modalType === 'approve' ? (
                    <Form.Group>
                      <Form.Label>Ongkos Kirim</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={shippingCost}
                        onChange={(e) => setShippingCost(e.target.value)}
                        required
                      />
                    </Form.Group>
                  ) : (
                    <Form.Group>
                      <Form.Label>Catatan Penolakan</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Masukkan alasan penolakan..."
                        required
                      />
                    </Form.Group>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button
                    variant={modalType === 'approve' ? 'success' : 'danger'}
                    onClick={handleSubmitStatusChange}
                  >
                    {modalType === 'approve' ? 'Setujui' : 'Tolak'}
                  </Button>
                </Modal.Footer>
              </Modal>
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default OrderCustomPCDetail;
