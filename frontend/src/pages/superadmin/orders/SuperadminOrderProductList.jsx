import React, { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosInstance';
import {
  Container, Table, Spinner, Button, Form, Tab, Tabs, Badge
} from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import { isSuperadmin } from '@/utils/authHelper';

const MySwal = withReactContent(Swal);

const SuperadminOrderProductList = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('menunggu_verifikasi');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  const statusList = [
    'menunggu_verifikasi',
    'menunggu_pembayaran',
    'diproses',
    'dikirim',
    'selesai',
    'dibatalkan'
  ];

  const formatStatus = (status) => ({
    menunggu_verifikasi: 'Menunggu Verifikasi',
    menunggu_pembayaran: 'Menunggu Pembayaran',
    diproses: 'Diproses',
    dikirim: 'Dikirim',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan'
  }[status] || status);

  const getStatusVariant = (status) => ({
    menunggu_verifikasi: 'warning',
    menunggu_pembayaran: 'secondary',
    diproses: 'primary',
    dikirim: 'info',
    selesai: 'success',
    dibatalkan: 'danger'
  }[status] || 'dark');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [resProduct, resCustom] = await Promise.all([
        api.get('/orders/admin/product'),
        api.get('/orders/admin/custom-pc')
      ]);

      const productOrders = resProduct.data.data.map(order => ({
        ...order,
        order_type: 'product'
      }));

      const customOrders = resCustom.data.data.map(order => ({
        ...order,
        order_type: 'custom_pc'
      }));

      const combined = [...productOrders, ...customOrders].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setOrders(combined);
    } catch (err) {
      console.error('Gagal memuat pesanan:', err);
      MySwal.fire('Error', 'Gagal memuat data pesanan.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSuperadmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Superadmin.',
        icon: 'error',
      }).then(() => navigate('/login/superadmin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();
    return () => stopInactivityTracker();
  }, [navigate]);

  useEffect(() => {
    if (isAuthorized) fetchOrders();
  }, [isAuthorized, fetchOrders]);

  const filteredOrders = orders.filter(order =>
    order.order_status === activeTab &&
    (orderTypeFilter === 'all' || order.order_type === orderTypeFilter) &&
    order.invoice_number.toLowerCase().includes(keyword.toLowerCase())
  );

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const renderOrderTypeBadge = (type) => (
    <Badge bg={type === 'product' ? 'primary' : 'warning'} text={type === 'product' ? undefined : 'dark'}>
      {type === 'product' ? 'Produk Biasa' : 'Perakitan PC'}
    </Badge>
  );

  if (!isAuthorized) return null;

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/superadmin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h4 className="fw-bold">Riwayat Pesanan (Hanya Lihat)</h4>
          </div>

          <Form className="mb-3 d-flex gap-2 flex-wrap">
            <Form.Control
              type="text"
              placeholder="Cari berdasarkan nomor invoice..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ minWidth: '250px' }}
            />
            <Form.Select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              style={{ minWidth: '200px' }}
            >
              <option value="all">Semua Jenis Pesanan</option>
              <option value="product">Produk Biasa</option>
              <option value="custom_pc">Perakitan PC</option>
            </Form.Select>
          </Form>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            {statusList.map(status => (
              <Tab key={status} eventKey={status} title={formatStatus(status)} />
            ))}
          </Tabs>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Invoice</th>
                  <th>Tipe</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      Tidak ada data pesanan dengan status ini.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <tr key={order.id + '-' + order.order_type}>
                      <td>{index + 1}</td>
                      <td>{order.invoice_number}</td>
                      <td>{renderOrderTypeBadge(order.order_type)}</td>
                      <td>{order.user?.name || '-'}</td>
                      <td>{formatCurrency(order.total_price)}</td>
                      <td>
                        <Badge bg={getStatusVariant(order.order_status)}>
                          {formatStatus(order.order_status)}
                        </Badge>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>
                        <Link
                          to={
                            order.order_type === 'product'
                              ? `/superadmin/orders/product/${order.id}`
                              : `/superadmin/orders/custom-pc/${order.id}`
                          }
                          className="btn btn-sm btn-outline-primary"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Container>
      </div>
    </>
  );
};

export default SuperadminOrderProductList;
