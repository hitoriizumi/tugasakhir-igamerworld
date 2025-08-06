import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Row, Col, Card, Spinner, Button
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authHelper';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('menunggu_pembayaran');

  const fetchOrders = useCallback(async () => {
    try {
      const [resProduct, resCustom] = await Promise.all([
        api.get('/orders/customer/product'),
        api.get('/orders/customer/custom-pc'),
      ]);

      const productOrders = resProduct.data.data.map(order => ({
        ...order,
        order_type: 'product'
      }));

      const customOrders = resCustom.data.data.map(order => ({
        ...order,
        order_type: 'custom_pc'
      }));

      const all = [...productOrders, ...customOrders].sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      );

      setOrders(all);
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal', 'Gagal memuat pesanan', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    AOS.init({ duration: 600 });

    if (!isCustomer()) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Silakan login sebagai pelanggan.',
      }).then(() => navigate('/login'));
      return;
    }

    fetchOrders();
  }, [fetchOrders, navigate]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);

  const orderStatuses = [
    { key: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
    { key: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
    { key: 'diproses', label: 'Diproses' },
    { key: 'dikirim', label: 'Dikirim' },
    { key: 'selesai', label: 'Selesai' },
    { key: 'dibatalkan', label: 'Dibatalkan' }
  ];

  const filteredOrders = orders.filter(order => order.order_status === activeStatus);

  const renderOrderTypeBadge = (type) => {
    if (type === 'product') {
      return <span className="badge bg-primary">Produk Biasa</span>;
    }
    if (type === 'custom_pc') {
      return <span className="badge bg-warning text-dark">Perakitan PC</span>;
    }
    return null;
  };

  const renderStatusBadge = (status) => {
    const text = status.replace(/_/g, ' ');
    const color = {
      menunggu_verifikasi: 'secondary',
      menunggu_pembayaran: 'warning',
      diproses: 'info',
      dikirim: 'primary',
      selesai: 'success',
      dibatalkan: 'danger'
    }[status] || 'dark';

    return <span className={`badge bg-${color} text-uppercase`}>{text}</span>;
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'selesai': return '#28a745';
      case 'dibatalkan': return '#dc3545';
      case 'diproses': return '#0dcaf0';
      case 'dikirim': return '#0d6efd';
      default: return '#f5c518';
    }
  };

  const getOrderItemCount = (order) => {
    if (order.order_type === 'custom_pc') {
      return order.custom_p_c_order?.custom_pc_components?.length || 0;
    } else {
      return order.order_items?.length || 0;
    }
  };

  const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white' }}>
          <h3 className="mb-4">Riwayat Pesanan</h3>

          <div
            className="d-flex mb-4 gap-3 overflow-auto px-2"
            style={{
              borderBottom: '1px solid #444',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {orderStatuses.map(({ key, label }) => {
              const count = orders.filter(o => o.order_status === key).length;
              return (
                <div
                  key={key}
                  onClick={() => setActiveStatus(key)}
                  style={{
                    cursor: 'pointer',
                    paddingBottom: '6px',
                    borderBottom: activeStatus === key ? '2px solid #f5c518' : 'none',
                    fontWeight: activeStatus === key ? 'bold' : 'normal',
                    color: activeStatus === key ? '#f5c518' : '#aaa',
                    transition: 'all 0.2s ease',
                    display: 'inline-block',
                    minWidth: 'fit-content',
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}
                >
                  {label} ({count})
                </div>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : filteredOrders.length === 0 ? (
            <div
              className="d-flex flex-column align-items-center justify-content-center w-100"
              style={{ minHeight: '50vh', textAlign: 'center' }}
            >
              <img
                src="/image/notfound.png"
                alt="belum ada pesanan"
                style={{ maxWidth: '200px', marginBottom: '1rem' }}
              />
              <div className="alert alert-warning w-auto" style={{ fontSize: '0.95rem' }}>
                eh, belum ada pesanan nih. yuk pesan dulu!.
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredOrders.map(order => (
                <Card
                  key={order.id + '-' + order.order_type}
                  className="p-3"
                  style={{
                    backgroundColor: '#2A2A2A',
                    cursor: 'pointer',
                    borderLeft: `6px solid ${getBorderColor(order.order_status)}`
                  }}
                >
                  <Row className="text-white justify-content-between">
                    <Col xs={12} md={9}>
                      <div className="d-flex gap-2 align-items-center mb-1 flex-wrap">
                        {renderOrderTypeBadge(order.order_type)}
                        <strong>{order.invoice_number}</strong>
                        <span style={{ fontSize: '0.85rem' }}>
                          • {getOrderItemCount(order)} item
                        </span>
                      </div>
                      <p className="mb-1">{formatCurrency(order.total_price)}</p>
                      <p className="mb-0" style={{ fontSize: '0.85rem' }}>
                        Tanggal Pembelian: {formatDate(order.created_at)}
                      </p>
                      <div className="mt-2">{renderStatusBadge(order.order_status)}</div>
                    </Col>

                    <Col
                      xs={12}
                      md={3}
                      className="mt-3 mt-md-0 d-flex flex-column align-items-md-end align-items-start gap-2"
                    >
                      {order.courier && (
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={order.courier.image}
                            alt="courier"
                            onError={(e) => { e.target.src = '/default-courier.png'; }}
                            style={{ height: '20px', width: 'auto' }}
                          />
                          <span className="text-warning" style={{ fontSize: '0.85rem' }}>{order.courier.name}</span>
                        </div>
                      )}
                      {order.payment_method && (
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={order.payment_method.image}
                            alt="payment"
                            onError={(e) => { e.target.src = '/default-payment.png'; }}
                            style={{ height: '20px', width: 'auto' }}
                          />
                          <span className="text-warning" style={{ fontSize: '0.85rem' }}>{order.payment_method.bank_name}</span>
                        </div>
                      )}
                      <div>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => {
                            if (order.order_type === 'product') {
                              navigate(`/history/${order.id}`);
                            } else {
                              navigate(`/history/custompc/${order.id}`);
                            }
                          }}
                        >
                          Lihat Detail
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default OrderList;
