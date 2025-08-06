import React, { useEffect, useState } from 'react';
import AOS from 'aos';
import {
  Container, Row, Col, Card, Button, Spinner, Badge, Alert
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import 'aos/dist/aos.css';

const CustomPCList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCustomer, setIsCustomer] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 600 });

    const token = localStorage.getItem('token_3');
    const role = localStorage.getItem('active_role');
    if (token && role === 'customer') setIsCustomer(true);

    const fetchOrders = async () => {
      if (!(token && role === 'customer')) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/custom-pc-orders');
        setOrders(res.data);
      } catch {
        alert('Gagal memuat pesanan perakitan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge bg="success">Disetujui</Badge>;
      case 'rejected':
        return <Badge bg="danger">Ditolak</Badge>;
      default:
        return <Badge bg="warning">Menunggu</Badge>;
    }
  };

  return (
    <>
      <NavbarCustomer />
      <Container style={{ paddingTop: '90px', minHeight: '100vh' }}>
        <Container className="pb-5">
          <h4 className="text-center text-dark mb-4" data-aos="fade-down">
            Daftar Pesanan Perakitan PC
          </h4>

          {!isCustomer && (
            <Alert variant="info" className="text-center" data-aos="fade-up">
              🔒 Kamu belum login sebagai pelanggan. Silakan login untuk menyimpan dan melihat pesanan rakitan kamu.
            </Alert>
          )}

          {loading ? (
            <div className="text-center my-5" data-aos="fade-up">
              <Spinner animation="border" />
            </div>
          ) : isCustomer && orders.length === 0 ? (
            <div className="text-center py-5" data-aos="fade-up">
              <p className="fs-5 mb-3">Belum ada pesanan. Yuk mulai rakit PC kamu!</p>
              <Button variant="primary" onClick={() => navigate('/perakitan/form')}>
                Buat Perakitan
              </Button>
            </div>
          ) : (
            <>
              {isCustomer && (
                <div className="d-flex justify-content-end mb-3" data-aos="fade-up">
                  <Button size="sm" variant="outline-primary" onClick={() => navigate('/perakitan/form')}>
                    + Buat Perakitan Baru
                  </Button>
                </div>
              )}
              <Row className="gy-4">
                {orders.map((order) => (
                  <Col xs={12} key={order.id} data-aos="fade-up">
                    <Card className="shadow-sm border-0">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start flex-column flex-md-row">
                          <div>
                            <Card.Title className="mb-2">Pesanan #{order.id}</Card.Title>
                            <Card.Text className="mb-2">
                              <strong>Komponen:</strong> {order.selected_components.length}<br />
                              <strong>Aksesoris:</strong> {order.selected_accessories?.length || 0}<br />
                              <strong>Metode Ambil:</strong> {order.metode_pengambilan === 'ambil' ? 'Ambil ke toko' : 'Dikirim'}<br />
                              <strong>Rakit oleh Admin:</strong> {order.rakit_oleh_admin ? 'Ya' : 'Tidak'}<br />
                              <strong>Status:</strong> {getStatusBadge(order.status)}
                            </Card.Text>
                          </div>
                          <div className="mt-3 mt-md-0">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => navigate(`/perakitan/${order.id}`)}
                            >
                              Lihat Detail
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Container>
      </Container>
      <FooterCustomer />
    </>
  );
};

export default CustomPCList;
