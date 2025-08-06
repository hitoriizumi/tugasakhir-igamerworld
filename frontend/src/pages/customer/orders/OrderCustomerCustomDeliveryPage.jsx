import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Card, Button, Spinner, Form, Col, Row
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import { isCustomer } from '@/utils/authHelper';

const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);

const OrderCustomerCustomDeliveryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [receivedNote, setReceivedNote] = useState('');

  useEffect(() => {
    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get(`/customer/orders/custom-pc/${id}/delivery`);
        setDelivery(res.data.data);
      } catch {
        setDelivery(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleConfirmReceived = async () => {
    const confirm = await Swal.fire({
      title: 'Konfirmasi',
      text: 'Apakah kamu yakin sudah menerima pesanan ini dengan baik?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, sudah diterima',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.put(`/customer/orders/custom-pc/${id}/delivery/confirm`, {
        notes: receivedNote
      });

      Swal.fire('Terima kasih!', 'Pesanan berhasil ditandai sebagai selesai.', 'success')
        .then(() => window.location.reload());
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal konfirmasi penerimaan.', 'error');
    }
  };

  const pickup = delivery?.pickup_method;
  const status = delivery?.order?.order_status;

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white' }}>
          <h3 className="mb-4">Informasi Pengiriman Rakitan PC</h3>

          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : !delivery ? (
            <div className="alert alert-warning text-white bg-warning bg-opacity-25 border-0 text-center">
              Pengiriman belum diatur oleh admin. Silakan tunggu konfirmasi.
            </div>
          ) : (
            <Row>
              {/* Bagian Kiri: Detail Info Pengiriman */}
              <Col xs={12} lg={7} className="mb-4">
                <Card className="p-4 rounded-4 shadow-lg" style={{ backgroundColor: '#2A2A2A', color: 'white' }}>
                  <div className="mb-3">
                    <div><strong>Invoice:</strong> {delivery.order?.invoice_number}</div>
                    <div><strong>Metode Pengambilan:</strong> {pickup === 'ambil' ? 'Ambil di Toko' : 'Dikirim ke Alamat'}</div>
                    <div><strong>Kurir:</strong> {delivery.order?.courier?.name || '-'}</div>
                    <div><strong>Metode Pembayaran:</strong> {delivery.order?.payment_method?.bank_name || '-'}</div>
                    <div><strong>Alamat Kirim:</strong> {delivery.order?.shipping_address?.full_address || '-'}</div>
                    <div><strong>Ongkir:</strong> {formatCurrency(Number(delivery.shipping_cost || 0))}</div>
                    <div><strong>Status Pesanan:</strong> {status?.replace(/_/g, ' ')}</div>
                  </div>

                  {pickup === 'ambil' && (
                    <div className="alert alert-info bg-info bg-opacity-25 border-0 text-white">
                      Pesanan ini harus diambil langsung di toko. Silakan datang sesuai jadwal yang ditentukan.
                    </div>
                  )}

                  {pickup === 'kirim' && (
                    <>
                      <div className="mb-3"><strong>No. Resi:</strong> {delivery.tracking_number || '-'}</div>
                      <div className="mb-3">
                        <strong>Perkiraan Sampai:</strong> {delivery.estimated_arrival
                          ? new Date(delivery.estimated_arrival).toLocaleDateString('id-ID')
                          : '-'}
                      </div>
                      {delivery.notes && (
                        <div className="mb-3"><strong>Catatan Admin:</strong> {delivery.notes}</div>
                      )}
                    </>
                  )}
                </Card>
              </Col>

              {/* Bagian Kanan: Bukti Gambar dan Tombol Aksi */}
              <Col xs={12} lg={5}>
                <Card className="p-4 rounded-4 shadow-lg" style={{ backgroundColor: '#2A2A2A', color: 'white' }}>
                  {pickup === 'kirim' && delivery.delivery_image && (
                    <div className="mb-4 text-center">
                      <h5>Bukti Pengiriman</h5>
                      <img
                        src={delivery.delivery_image}
                        alt="Bukti Pengiriman"
                        style={{
                          width: '100%',
                          maxHeight: '300px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setShowProofModal(true)}
                      />
                    </div>
                  )}

                  {pickup === 'kirim' && status === 'dikirim' && (
                    <div className="d-flex justify-content-end">
                      <Button variant="success" onClick={() => setShowNoteModal(true)}>
                        Pesanan Sudah Diterima
                      </Button>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {delivery?.order?.custom_p_c_order?.custom_pc_components?.length > 0 && (
            <>
                <h5 className="mt-5 mb-3">Komponen Rakitan</h5>

                {/* 🔖 Penanda Order Rakitan */}
                <div className="mb-3 text-white-50 fst-italic">
                  <small>
                    Jenis Pesanan:
                    <span className="ms-2">
                      {delivery.order?.order_type === 'custom_pc' ? 'Rakitan PC' : 'Produk Biasa'}
                    </span>
                  </small>
                </div>

                {/* 🚨 Alert jika ada pre-order */}
                {delivery.order.custom_p_c_order.custom_pc_components.some(item => item.product?.status_stock === 'pre_order') && (
                <div className="alert alert-warning bg-warning bg-opacity-25 border-0 text-white">
                    Tidak ada split pengiriman. Semua komponen akan dikirim jika seluruhnya telah tersedia.
                </div>
                )}

                <div className="border p-3 mb-5" style={{ borderColor: '#f5c518', borderWidth: '1px', borderStyle: 'solid' }}>
                  {delivery.order.custom_p_c_order.custom_pc_components.map((item) => (
                    <Card key={item.id} className="mb-3" style={{ backgroundColor: '#2A2A2A', color: 'white' }}>
                      <Card.Body className="d-flex align-items-center">
                        <img
                          src={item.product?.main_image}
                          alt={item.product?.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                        />
                        <div>
                          <div><strong>{item.product?.name}</strong></div>
                          <div>
                            Status:&nbsp;
                            <span className={`badge ${
                              item.product?.status_stock?.toLowerCase() === 'pre_order' ? 'bg-warning text-dark' : 'bg-success'
                            }`}>
                              {item.product?.status_stock?.toLowerCase() === 'pre_order' ? 'Pre-Order' : 'Ready Stock'}
                            </span>
                          </div>
                          <div>Harga: {formatCurrency(item.price)}</div>
                          <div>Jumlah: {item.quantity}</div>
                          <div>Subtotal: {formatCurrency(item.subtotal)}</div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <strong>Total Belanja</strong>
                    <strong>
                      {formatCurrency(
                          delivery.order.custom_p_c_order.custom_pc_components.reduce((sum, i) => sum + Number(i.subtotal || 0), 0)
                      )} + {formatCurrency(Number(delivery.shipping_cost || 0))} (ongkir)
                      <span className="ms-2">= {formatCurrency(
                        delivery.order.custom_p_c_order.custom_pc_components.reduce((sum, i) => sum + Number(i.subtotal || 0), 0) + Number(delivery.shipping_cost || 0)
                      )}</span>
                    </strong>
                </div>
              </div>
            </>
            )}
        </Container>
      </div>

      {/* MODAL - Bukti Gambar */}
      {showProofModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#1c1c1c', color: 'white' }}>
                <div className="modal-header">
                  <h5 className="modal-title">Bukti Pengiriman</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowProofModal(false)}></button>
                </div>
                <div className="modal-body text-center">
                  <img
                    src={delivery?.delivery_image}
                    alt="Bukti Pengiriman"
                    style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '10px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL - Konfirmasi Diterima */}
      {showNoteModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2A2A2A', color: 'white' }}>
                <div className="modal-header">
                  <h5 className="modal-title">Konfirmasi Pesanan Diterima</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowNoteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <Form.Group className="mb-3">
                    <Form.Label>Catatan (opsional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={receivedNote}
                      onChange={(e) => setReceivedNote(e.target.value)}
                      placeholder="Contoh: Barang sampai dengan baik."
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button variant="success" onClick={handleConfirmReceived}>
                      Kirim & Tandai Selesai
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <FooterCustomer />
    </>
  );
};

export default OrderCustomerCustomDeliveryPage;
