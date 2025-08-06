import React, { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardNavbar from '@/components/DashboardNavbar';
import { Container, Row, Col, Card, Spinner, Form, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';
import api from '@/api/axiosInstance';
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer
} from 'recharts';
import {
  Box, BoxSelect, Wallet, PackageCheck,
  ShoppingCart, AlertTriangle, Clock3, TrendingUp
} from 'lucide-react';

const AdminDashboard = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);
  const navigate = useNavigate();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4444', '#AA66CC'];

  useEffect(() => {
    if (!isAdmin()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai admin.', 'warning')
        .then(() => navigate('/login/admin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();

    return () => stopInactivityTracker();
  }, [navigate]);

  useEffect(() => {
    if (isAuthorized) fetchStats();
  }, [isAuthorized]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard-stats');
      setStats(res.data);
      const years = res.data.available_years;
      if (years.length > 0) {
        setSelectedYear(years[years.length - 1]);
      }
    } catch (error) {
      console.error('Gagal memuat statistik dashboard:', error);
      Swal.fire('Error', 'Gagal memuat data statistik.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    const map = {
      menunggu_verifikasi: 'warning',
      diproses: 'primary',
      dikirim: 'info',
      selesai: 'success',
      dibatalkan: 'danger',
    };
    return map[status] || 'secondary';
  };

  if (!isAuthorized || loading || !stats) {
    return (
      <>
        <DashboardSidebar />
        <DashboardNavbar redirectLogout="/login/admin" />
        <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
          <div className="text-center mt-5">
            <Spinner animation="border" variant="primary" />
            <p>Memuat statistik dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  const orderStatusData = stats.orders_by_status
    ? Object.entries(stats.orders_by_status).map(([status, total]) => ({
        name: status.replace(/_/g, ' '),
        value: total
      }))
    : [];

  const monthlyData =
    stats.order_stats_by_year?.[selectedYear]?.map((item) => ({
      month: new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'short' }),
      total: item.total
    })) || [];

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />
      <div style={{ paddingLeft: '120px', paddingRight: '40px', paddingTop: '90px', paddingBottom: '20px', minHeight: '100vh' }}>
        <Container fluid>
          <h4 className="mb-4">Statistik Dashboard Admin</h4>

          {/* Ringkasan */}
          <Row className="mb-4">
            <Col md={3}>
              <Card bg="primary" text="white">
                <Card.Body>
                  <Card.Title><ShoppingCart className="me-2" size={20} /> Total Pesanan</Card.Title>
                  <Card.Text className="fs-3">{stats.total_orders}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card bg="success" text="white">
                <Card.Body>
                  <Card.Title><PackageCheck className="me-2" size={20} /> Produk Aktif</Card.Title>
                  <Card.Text className="fs-3">{stats.products.aktif}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card bg="secondary" text="white">
                <Card.Body>
                  <Card.Title><PackageCheck className="me-2" size={20} /> Produk Nonaktif</Card.Title>
                  <Card.Text className="fs-3">{stats.products.nonaktif}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card bg="warning" text="white">
                <Card.Body>
                  <Card.Title><Clock3 className="me-2" size={20} /> Pesanan Hari Ini</Card.Title>
                  <Card.Text className="fs-3">{stats.today_orders}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Tambahan */}
          <Row className="mb-4">
            <Col md={3}>
              <Card>
                <Card.Body>
                  <Card.Title><AlertTriangle className="me-2" size={20} /> Stok Rendah (&lt; 5)</Card.Title>
                  <Card.Text className="fs-4">{stats.low_stock_count} produk</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card>
                <Card.Body>
                  <Card.Title><BoxSelect className="me-2" size={20} />Re-stock Pre Order</Card.Title>
                  <Card.Text className="fs-4">{stats.pre_order_count} stok yang harus di re-stock</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card>
                <Card.Body>
                  <Card.Title><Box className="me-2" size={20} /> Belum Diverifikasi</Card.Title>
                  <Card.Text className="fs-4">{stats.unverified_orders_count} pesanan</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card>
                <Card.Body>
                  <Card.Title><Wallet className="me-2" size={20} /> Total Pembayaran Masuk</Card.Title>
                  <Card.Text className="fs-4">Rp {Number(stats.total_paid_amount).toLocaleString('id-ID')}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Grafik */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title className="text-center">Pesanan Berdasarkan Status</Card.Title>
                  {orderStatusData.length === 0 ? (
                    <div className="text-center text-muted mt-3">Belum ada data status pesanan.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={orderStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                          {orderStatusData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title className="text-center">Statistik Pesanan per Bulan ({selectedYear})</Card.Title>
                  <Form.Group className="mb-3" controlId="selectYear">
                    <Form.Label>Pilih Tahun</Form.Label>
                    <Form.Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                      {stats.available_years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  {monthlyData.length === 0 ? (
                    <div className="text-center text-muted mt-3">Belum ada data untuk tahun ini.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="total" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Pesanan Terbaru & Produk Terlaris */}
          <Row className="mb-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>5 Pesanan Terbaru</Card.Title>
                  <Table responsive bordered hover>
                    <thead>
                      <tr>
                        <th>#Invoice</th>
                        <th>Pelanggan</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.latest_orders.map((order) => (
                        <tr key={order.id}>
                          <td>{order.invoice_number}</td>
                          <td>{order.user?.name}</td>
                          <td>
                            <Badge bg={getStatusVariant(order.order_status)}>
                              {order.order_status.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title><TrendingUp className="me-2" size={20} /> Produk Terlaris Sepanjang Waktu</Card.Title>
                  {stats.best_selling_products.length === 0 ? (
                    <p className="text-muted">Belum ada data penjualan.</p>
                  ) : (
                    <ol className="mb-0">
                      {stats.best_selling_products.map((p) => (
                        <li key={p.id} className="mb-1 d-flex justify-content-between">
                          <span>{p.name}</span>
                          <span><strong>{p.total_sold}</strong> terjual</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default AdminDashboard;
