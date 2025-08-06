import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Spinner
} from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authHelper';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [address, setAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    shipping_address_id: '',
    courier_id: '',
    payment_method_id: '',
    note: ''
  });

  const cartIds = useMemo(() => location.state?.cart_ids || [], [location.state]);

  const fetchData = useCallback(async () => {
    try {
      const [cartRes, addressRes, courierRes, paymentRes] = await Promise.all([
        api.get('/cart'),
        api.get('/customer/shipping-addresses'),
        api.get('/public/couriers'),
        api.get('/public/payment-methods')
      ]);

      const selectedCart = (cartRes.data.data || []).filter(item => cartIds.includes(item.id));
      setCartItems(selectedCart);
      console.log('CART STATUS:', selectedCart.map(item => ({
    id: item.id,
    name: item.product.name,
    status: item.product.status,
    status_stock: item.product.status_stock
  })));


      const allAddresses = addressRes.data.data;
      const primary = allAddresses.find(addr => addr.is_primary);

      setAddresses(allAddresses);
      setAddress(primary);
      setForm(prev => ({ ...prev, shipping_address_id: primary?.id || '' }));

      if (!primary) {
        Swal.fire('Alamat Tidak Ditemukan', 'Silakan atur alamat utama terlebih dahulu.', 'warning');
      }

      setCouriers(courierRes.data.data);
      setPaymentMethods(paymentRes.data.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Gagal', 'Gagal memuat data checkout.', 'error');
    } finally {
      setLoading(false);
    }
  }, [cartIds]);

  useEffect(() => {
    AOS.init({ duration: 600 });
  }, []);

  useEffect(() => {
    if (!isCustomer()) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Silakan login sebagai pelanggan.',
      }).then(() => navigate('/login'));
      return;
    }

    if (!cartIds.length) {
      Swal.fire({
        icon: 'info',
        title: 'Keranjang Kosong',
        text: 'Tidak ada produk yang dipilih untuk checkout.',
      }).then(() => navigate('/cart'));
      return;
    }

    fetchData();
  }, [fetchData, cartIds, navigate]);

  const handleSelectAddress = (selectedAddress) => {
    setAddress(selectedAddress);
    setForm(prev => ({
      ...prev,
      shipping_address_id: selectedAddress.id
    }));
    setShowModal(false);
  };

  const handleSubmit = async () => {
    if (!form.shipping_address_id || !form.courier_id || !form.payment_method_id) {
      Swal.fire('Lengkapi Form', 'Harap pilih alamat, kurir, dan metode pembayaran.', 'warning');
      return;
    }

    try {
      await api.post('/checkout', {
        ...form,
        cart_ids: cartIds.map(id => parseInt(id, 10)),
        courier_id: parseInt(form.courier_id, 10),
        payment_method_id: parseInt(form.payment_method_id, 10),
      });

      Swal.fire('Berhasil', 'Pesanan berhasil dibuat.', 'success')
        .then(() => navigate('/history'));
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat melakukan checkout.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);

  const totalPrice = cartItems.reduce((sum, item) =>
    sum + item.product.price * item.quantity, 0);

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh', color: 'white' }}>
        <Container style={{ maxWidth: '1280px' }}>
          <h2 className="mb-4">Checkout</h2>
          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : (
            <Row>
              <Col md={8}>
                <Card className="mb-3" style={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Alamat Pengiriman</h5>
                      <Button
                        size="sm"
                        variant="outline-light"
                        onClick={() => setShowModal(true)}
                        aria-label="Ganti Alamat"
                      >
                        Ganti Alamat
                      </Button>
                    </div>

                    {address ? (
                      <div style={{ border: '1px solid gold', borderRadius: '4px', padding: '10px' }}>
                        <strong>{address.recipient_name}</strong>
                        {address.is_primary && (
                          <span className="badge bg-info ms-2">Utama</span>
                        )}
                        <br />
                        {address.phone_number}<br />
                        {address.full_address}
                      </div>
                    ) : (
                      <div>
                        <p>Alamat utama tidak ditemukan.</p>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => navigate('/profile/address')}
                        >
                          Tambah Alamat
                        </Button>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                <Form.Group className="mb-3">
                  <Form.Label>Pengiriman</Form.Label>
                  <Form.Select
                    disabled={!address}
                    value={form.courier_id}
                    onChange={e => setForm({ ...form, courier_id: e.target.value })}
                  >
                    <option value="">Pilih pengiriman</option>
                    {couriers.map(courier => (
                      <option key={courier.id} value={courier.id}>{courier.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Metode Pembayaran</Form.Label>
                  <Form.Select
                    disabled={!address}
                    value={form.payment_method_id}
                    onChange={e => setForm({ ...form, payment_method_id: e.target.value })}
                  >
                    <option value="">Pilih metode pembayaran</option>
                    {paymentMethods.map(pm => (
                      <option key={pm.id} value={pm.id}>{pm.bank_name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Catatan untuk Admin (opsional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="Tulis catatan jika ada..."
                    value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                  />
                </Form.Group>

                <Card style={{ backgroundColor: '#2a2a2a', color: 'white', border: '1px solid gold' }}>
                  <Card.Body>
                    {cartItems.map(item => (
                      <div key={item.id} className="d-flex align-items-center mb-3">
                        <img
                          src={item.product.images?.[0]?.image_url || item.product.main_image}
                          alt={item.product.name}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px', backgroundColor: '#fff' }}
                        />
                        <div>
                          <strong>{item.product.name}</strong><br />
                          {formatCurrency(item.product.price)}<br />
                          Jumlah: {item.quantity}
                        </div>
                      </div>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={4}>
                <Card style={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                  <Card.Body>
                    <h5>Ringkasan Pesanan</h5>
                    <div className="d-flex justify-content-between">
                      <span>Total Harga</span>
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    <hr />

                    {cartItems.some(item =>
                      item.product.status_stock?.toLowerCase().trim() === 'pre_order'
                    ) && (
                      <div className="alert alert-warning w-auto" style={{ fontSize: '0.95rem' }}>
                        Terdapat produk dengan status <strong>pre-order</strong>. Proses pengiriman mungkin memerlukan waktu lebih lama dari biasanya, sesuai estimasi admin. Silakan cek kembali sebelum melanjutkan pembayaran.
                      </div>
                    )}

                    <div className="d-flex justify-content-between mb-3">
                      <p style={{ fontSize: '13px', color: 'white' }}>
                        ongkos kirim menyesuaikan ketika sudah diterima admin
                      </p>
                    </div>
                    <Button
                      variant="warning"
                      className="w-100"
                      onClick={handleSubmit}
                      disabled={!form.shipping_address_id || !form.courier_id || !form.payment_method_id || loading}
                    >
                      Lanjut Pembayaran
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>

        {showModal && (
          <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                <div className="modal-header">
                  <h5 className="modal-title">Pilih Alamat Pengiriman</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} />
                </div>
                <div className="modal-body">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className="mb-3 p-3 border rounded"
                      style={{ borderColor: addr.id === address?.id ? 'gold' : '#555', cursor: 'pointer' }}
                      onClick={() => handleSelectAddress(addr)}
                    >
                      <strong>{addr.recipient_name}</strong><br />
                      {addr.phone_number}<br />
                      {addr.full_address}
                      {addr.is_primary && (
                        <span className="badge bg-info ms-2">Utama</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <FooterCustomer />
    </>
  );
};

export default CheckoutPage;
