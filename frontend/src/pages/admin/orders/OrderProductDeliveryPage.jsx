import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Card, Button, Spinner, Modal, Form, Table
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import { isAdmin } from '@/utils/authHelper';

const MySwal = withReactContent(Swal);

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);

const OrderProductDeliveryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const [formData, setFormData] = useState({
    tracking_number: '',
    estimated_arrival: null,
    notes: '',
    delivery_image: null,
  });

  const fetchDelivery = useCallback(async () => {
    try {
      const res = await api.get(`/orders/product/${id}/delivery`);
      const data = res.data.data;
      setDelivery(data);
      setFormData({
        tracking_number: data.tracking_number || '',
        estimated_arrival: data.estimated_arrival ? new Date(data.estimated_arrival) : null,
        notes: data.notes || '',
        delivery_image: null,
      });
    } catch {
      MySwal.fire('Gagal', 'Gagal memuat data pengiriman.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

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
    if (isAuthorized) fetchDelivery();
  }, [isAuthorized, fetchDelivery]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async () => {
    const confirm = await MySwal.fire({
      title: 'Konfirmasi',
      text: 'Yakin ingin menyimpan data pengiriman ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
    });
    if (!confirm.isConfirmed) return;

    if (formData.delivery_image && !formData.delivery_image.type.startsWith('image/')) {
      MySwal.fire('Format Salah', 'File harus berupa gambar.', 'warning');
      return;
    }

    setSubmitting(true);
    const payload = new FormData();
    payload.append('tracking_number', formData.tracking_number);
    payload.append('estimated_arrival', formData.estimated_arrival ? formData.estimated_arrival.toISOString().split('T')[0] : '');
    payload.append('notes', formData.notes);
    if (formData.delivery_image) payload.append('delivery_image', formData.delivery_image);

    try {
      await api.post(`/orders/product/${id}/delivery`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      MySwal.fire('Berhasil', 'Data pengiriman berhasil diperbarui.', 'success');
      fetchDelivery();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal memperbarui data.';
      MySwal.fire('Gagal', message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAsFinished = async () => {
    const confirm = await MySwal.fire({
      title: 'Konfirmasi',
      text: 'Yakin ingin menandai pesanan ini sebagai selesai?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, tandai selesai',
      cancelButtonText: 'Batal'
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.put(`/orders/product/${id}/delivery/finish`);
      MySwal.fire('Berhasil', 'Pesanan telah ditandai sebagai selesai.', 'success');
      fetchDelivery();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menyelesaikan pesanan.';
      MySwal.fire('Gagal', message, 'error');
    }
  };

  const pickupMethod = delivery?.pickup_method;
  const orderStatus = delivery?.order?.order_status;
  const isSelesai = orderStatus === 'selesai';

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
              <h4 className="fw-bold mb-4">Manajemen Pengiriman Pesanan Produk Biasa</h4>

              {isSelesai && (
                <div className="alert alert-success">
                  Pesanan ini sudah selesai. Data pengiriman tidak dapat diubah lagi.
                </div>
              )}

              <div className="mb-3">
                <div><strong>Invoice:</strong> {delivery?.order?.invoice_number}</div>
                <div><strong>Metode Pengambilan:</strong> {pickupMethod === 'ambil' ? 'Ambil di Toko' : 'Dikirim ke Alamat'}</div>
                <div><strong>Ongkir:</strong> Rp {delivery?.shipping_cost?.toLocaleString('id-ID') || '0'}</div>
              </div>

              <Card className="mb-4">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Produk dalam Pesanan</h5>
                  <Table striped bordered responsive hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nama Produk</th>
                        <th>Harga</th>
                        <th>Jumlah</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {delivery.order.order_items.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.product?.name || '-'}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              <Card className="p-4">
                {pickupMethod === 'kirim' && (
                  <Form.Group className="mb-3">
                    <Form.Label>No. Resi</Form.Label>
                    <Form.Control
                      name="tracking_number"
                      value={formData.tracking_number}
                      onChange={handleChange}
                      placeholder="Masukkan nomor resi"
                      disabled={isSelesai}
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Perkiraan Sampai / Pengambilan</Form.Label>
                  <DatePicker
                    selected={formData.estimated_arrival}
                    onChange={(date) => setFormData({ ...formData, estimated_arrival: date })}
                    className="form-control"
                    placeholderText="Pilih tanggal"
                    dateFormat="dd-MM-yyyy"
                    disabled={isSelesai}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Catatan</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Catatan pengiriman..."
                    disabled={isSelesai}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Bukti Pengiriman / Pengambilan</Form.Label>
                  <Form.Control
                    type="file"
                    name="delivery_image"
                    accept="image/*"
                    onChange={handleChange}
                    disabled={isSelesai}
                  />
                  {delivery?.delivery_image && (
                    <div className="mt-2">
                      <Button variant="outline-dark" onClick={() => setShowImageModal(true)}>
                        Lihat Bukti Sebelumnya
                      </Button>
                    </div>
                  )}
                </Form.Group>

                <p>Status sekarang: {orderStatus?.replace(/_/g, ' ')}</p>
                <p>Pickup method: {pickupMethod}</p>

                {!isSelesai && (
                  <div className="d-flex justify-content-end">
                    <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Menyimpan...' : 'Simpan Data'}
                    </Button>
                  </div>
                )}

                {pickupMethod === 'kirim' && orderStatus === 'dikirim' && (
                  <div className="mt-3 d-flex justify-content-end">
                    <Button
                      variant="success"
                      onClick={handleMarkAsFinished}
                      disabled={submitting}
                    >
                      Tandai sebagai Selesai
                    </Button>
                  </div>
                )}
              </Card>

              <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="xl">
                <Modal.Header closeButton>
                  <Modal.Title>Bukti Pengiriman/Pengambilan</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                  <img
                    src={delivery?.delivery_image}
                    alt="Bukti Pengiriman"
                    style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px' }}
                  />
                </Modal.Body>
              </Modal>
            </>
          )}
        </Container>
      </div>
    </>
  );
};

export default OrderProductDeliveryPage;
