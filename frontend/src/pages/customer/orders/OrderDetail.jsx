import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Card, Spinner, Button
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import { isCustomer } from '@/utils/authHelper';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isCustomer()) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Silakan login sebagai pelanggan.',
      }).then(() => navigate('/login'));
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/customer/product/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        console.error(err);
        Swal.fire('Gagal', 'Tidak dapat mengambil detail pesanan.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const subtotal = order?.order_items?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const shippingCost = Number(order?.order_delivery?.shipping_cost || 0);
  const totalBelanja = subtotal + shippingCost;

  const replaceAndCapitalize = (text) =>
    text.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const handleConfirmPayment = () => {
    if (order.order_status === 'menunggu_verifikasi') {
      Swal.fire('Belum bisa konfirmasi', 'Tunggu admin menyetujui pesanan kamu dulu ya.', 'info');
    } else {
      navigate(`/history/${id}/payment`);
    }
  };


  const handleViewDelivery = () => {
    const status = order.order_status;
    
    if (['menunggu_verifikasi', 'menunggu_pembayaran', 'diproses'].includes(status)) {
      Swal.fire('Belum bisa dilihat', 'Informasi pengiriman akan tersedia setelah barang dikirim oleh admin.', 'info');
    } else {
      navigate(`/history/${id}/delivery`);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'menunggu_verifikasi':
        return <span className="badge bg-secondary">Menunggu Verifikasi</span>;
      case 'menunggu_pembayaran':
        return <span className="badge bg-warning text-dark">Menunggu Pembayaran</span>;
      case 'diproses':
        return <span className="badge bg-primary">Diproses</span>;
      case 'dikirim':
        return <span className="badge bg-info text-dark">Dikirim</span>;
      case 'selesai':
        return <span className="badge bg-success">Selesai</span>;
      case 'dibatalkan':
        return <span className="badge bg-danger">Dibatalkan</span>;
      default:
        return <span className="badge bg-dark">{replaceAndCapitalize(status)}</span>;
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'belum_bayar':
        return <span className="badge bg-warning text-dark">Belum Bayar</span>;
      case 'sudah_bayar':
        return <span className="badge bg-success">Sudah Bayar</span>;
      case 'gagal':
        return <span className="badge bg-danger">Gagal</span>;
      default:
        return <span className="badge bg-dark">{replaceAndCapitalize(status)}</span>;
    }
  };

  const notesFromCustomer = order?.order_notes?.filter(note => note.user?.role_id === 3) || [];
  const notesFromAdmin = order?.order_notes?.filter(note => note.user?.role_id === 2) || [];

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white' }}>
          <h3 className="mb-4">Detail Pesanan</h3>
          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : order ? (
            <Row>
              <Col md={5}>
                <Card style={{ backgroundColor: '#2A2A2A', color: 'white' }} className="p-3 mb-4">
                  <h5 className="mb-4">Informasi Order</h5>
                  {['selesai', 'dibatalkan'].includes(order.order_status) && (
                    <div className="alert alert-warning w-auto" style={{ fontSize: '0.95rem' }}>
                      {order.order_status === 'selesai'
                        ? 'Pesanan ini telah selesai dan tidak dapat diubah.'
                        : 'Pesanan ini telah dibatalkan oleh admin.'}
                    </div>
                  )}
                  {[
                    ['Invoice', order.invoice_number],
                    ['Tanggal Pemesanan', formatDate(order.created_at)],
                    ['Metode Pengiriman', order.courier?.name || '-'],
                    ['Metode Pembayaran', order.payment_method?.bank_name || '-'],
                    ['Metode Pengambilan', replaceAndCapitalize(order.order_delivery?.pickup_method || '-')],
                    ['Alamat Pengiriman', order.shipping_address?.full_address || '-'],
                    ['Ongkos Kirim', formatCurrency(order.order_delivery?.shipping_cost || 0)],
                    ['Status Order', replaceAndCapitalize(order.order_status)],
                    ['Status Pembayaran', replaceAndCapitalize(order.payment_status)],
                  ].map(([label, value]) => (
                    <div className="mb-3" key={label}>
                      <div className="text-warning" style={{ fontSize: '14px' }}>{label}</div>
                      <div className="fw-semibold" style={{ fontSize: '1rem' }}>
                        {label === 'Status Order'
                          ? getOrderStatusBadge(order.order_status)
                          : label === 'Status Pembayaran'
                          ? getPaymentStatusBadge(order.payment_status)
                          : value}
                      </div>
                    </div>
                  ))}

                  {notesFromCustomer.length > 0 && (
                    <div className="mb-3">
                      <div className="text-warning" style={{ fontSize: '0.8rem' }}>Catatan dari kamu ke admin</div>
                      {notesFromCustomer.map(note => (
                        <div key={note.id} className="p-2 mt-1 rounded bg-dark border-start border-warning" style={{ fontStyle: 'italic' }}>
                          "{note.note}"
                        </div>
                      ))}
                    </div>
                  )}

                  {notesFromAdmin.length > 0 && (
                    <div className="mb-3">
                      <div className="text-warning" style={{ fontSize: '0.8rem' }}>Catatan dari admin nih</div>
                      {notesFromAdmin.map(note => (
                        <div key={note.id} className="p-2 mt-1 rounded bg-dark border-start border-info" style={{ fontStyle: 'italic' }}>
                          "{note.note}"
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="d-grid gap-2 mt-4">
                    <Button
                      variant="warning"
                      onClick={handleConfirmPayment}
                    >
                      Konfirmasi Pembayaran
                    </Button>
                    <Button
                      variant="info"
                      onClick={handleViewDelivery}
                    >
                      Lihat Detail Pengiriman
                    </Button>
                  </div>
                </Card>
              </Col>
              <Col md={7}>
                <div className="border p-3" style={{ borderColor: '#f5c518', borderWidth: '1px', borderStyle: 'solid' }}>
                  {order.order_items?.map(item => (
                    <Card
                      key={item.id}
                      className="mb-3"
                      style={{ backgroundColor: '#2A2A2A', color: 'white' }}
                    >
                      <Card.Body className="d-flex align-items-center">
                        <img
                          src={item.product?.main_image}
                          alt={item.product?.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                        />
                        <div>
                          <div><strong>{item.product?.name}</strong></div>
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
                      {formatCurrency(subtotal)} + {formatCurrency(shippingCost)} (ongkir)
                      <span className="ms-2">= {formatCurrency(totalBelanja)}</span>
                    </strong>
                  </div>
                </div>
              </Col>
            </Row>
          ) : (
            <div
              className="d-flex flex-column align-items-center justify-content-center w-100"
              style={{ minHeight: '50vh', textAlign: 'center' }}
            >
              <img
                src="/image/notfound.png"
                alt="pesanan tidak ditemukan"
                style={{ maxWidth: '200px', marginBottom: '1rem' }}
              />
              <div className="alert alert-warning w-auto" style={{ fontSize: '0.95rem' }}>
                Pesanan tidak di temukan.
              </div>
            </div>
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default OrderDetail;
