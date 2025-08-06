import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Card, Row, Col, Button, Spinner, Modal, Form
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import { isAdmin } from '@/utils/authHelper';

const MySwal = withReactContent(Swal);

const OrderProductPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

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

  const fetchConfirmation = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}/payment-confirmation`);
      setConfirmation(res.data.data);
    } catch {
      setConfirmation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAuthorized) fetchConfirmation();
  }, [isAuthorized, fetchConfirmation]);

  const handleVerify = async (isVerified, note = '') => {
    if (!isVerified && !note.trim()) {
      return MySwal.fire('Gagal', 'Catatan penolakan harus diisi.', 'warning');
    }

    setVerifying(true);
    try {
      await api.patch(`/orders/${id}/payment-confirmation/verify`, {
        is_verified: isVerified,
        note
      });

      MySwal.fire('Berhasil', `Pembayaran berhasil di${isVerified ? 'setujui' : 'tolak'}.`, 'success')
        .then(() => navigate(`/admin/orders/product/${id}`));
    } catch {
      MySwal.fire('Gagal', 'Terjadi kesalahan saat verifikasi pembayaran.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const isVerified = confirmation?.is_verified;
  const order = confirmation?.order;
  const paidAt = confirmation?.order?.paid_at;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (!isAuthorized) return null;

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
              <h4 className="fw-bold mb-4">Verifikasi Pembayaran Produk Biasa</h4>

              {confirmation?.order ? (
                <>
                  <div className="mb-3">
                    <div><strong>Invoice:</strong> {confirmation.order.invoice_number}</div>
                    <div><strong>Total:</strong>{" "}
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                      }).format(confirmation.order.total_price)}
                    </div>
                    {paidAt && (
                      <div><strong>Dibayar Pada:</strong> {formatDate(paidAt)}</div>
                    )}
                  </div>

                  <Card className="p-3 mb-4">
                    <Row>
                      <Col md={6}>
                        <p><strong>Pelanggan:</strong> {confirmation.user?.name || '-'}</p>
                        <p><strong>Bank:</strong> {confirmation.bank_name || '-'}</p>
                        <p><strong>No. Rekening:</strong> {confirmation.account_number || '-'}</p>
                        <p><strong>Waktu Transfer:</strong> {confirmation.transfer_time ? formatDate(confirmation.transfer_time) : '-'}</p>
                      </Col>
                      <Col md={6} className="text-center">
                        <p><strong>Bukti Transfer:</strong></p>
                        {confirmation.payment_image ? (
                          <Button variant="outline-dark" onClick={() => setShowImageModal(true)}>
                            Lihat Bukti Gambar
                          </Button>
                        ) : (
                          <p className="text-muted fst-italic">Tidak ada bukti gambar.</p>
                        )}
                      </Col>
                    </Row>
                  </Card>

                  {isVerified === 1 && (
                    <div className="alert alert-success">✅ Pembayaran sudah kamu verifikasi</div>
                  )}
                  {isVerified === 0 && order?.payment_status === 'gagal' && (
                    <div className="alert alert-danger">❌ Pembayaran sudah kamu tolak</div>
                  )}
                  {isVerified === null && (
                    <div className="alert alert-warning">⏳ Pembayaran sedang menunggu verifikasi</div>
                  )}

                  {isVerified === null && (
                    <div className="d-flex justify-content-end gap-3">
                      <Button variant="danger" onClick={() => setShowModal(true)} disabled={verifying}>
                        Tolak Pembayaran
                      </Button>
                      <Button variant="success" onClick={() => handleVerify(true)} disabled={verifying}>
                        {verifying ? 'Memverifikasi...' : 'Setujui Pembayaran'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-4">
                  <h5 className="text-center">Belum ada konfirmasi pembayaran dari pelanggan.</h5>
                  <p className="text-center text-muted mb-0">Silakan cek kembali nanti setelah pelanggan melakukan konfirmasi.</p>
                </Card>
              )}

              {/* MODAL PENOLAKAN */}
              <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Tolak Pembayaran</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Group>
                    <Form.Label>Catatan Penolakan</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Tulis alasan penolakan..."
                      required
                    />
                  </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setShowModal(false);
                      handleVerify(false, rejectNote);
                    }}
                    disabled={verifying}
                  >
                    {verifying ? 'Mengirim...' : 'Tolak Pembayaran'}
                  </Button>
                </Modal.Footer>
              </Modal>

              {/* MODAL BUKTI PEMBAYARAN */}
              {confirmation?.payment_image && (
                <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="xl">
                  <Modal.Header closeButton>
                    <Modal.Title>Bukti Pembayaran</Modal.Title>
                  </Modal.Header>
                  <Modal.Body className="text-center">
                    <img
                      src={confirmation.payment_image}
                      alt="Bukti Pembayaran"
                      style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px' }}
                    />
                  </Modal.Body>
                </Modal>
              )}
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default OrderProductPaymentPage;
