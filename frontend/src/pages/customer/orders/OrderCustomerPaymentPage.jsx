import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Card, Form, Button, Spinner, Modal, Row, Col
} from 'react-bootstrap';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import 'animate.css';
import { isCustomer } from '@/utils/authHelper';

const OrderCustomerPaymentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [form, setForm] = useState({
    bank_name: '',
    account_number: '',
    transfer_time: '',
    payment_image: null
  });

  useEffect(() => {
    if (!isCustomer()) {
      Swal.fire({
        icon: 'warning',
        title: 'Akses Ditolak',
        text: 'Silakan login sebagai pelanggan.',
      }).then(() => navigate('/login'));
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get(`/orders/customer/product/${id}`);
        const orderData = res.data.data;

        if (orderData.order_status === 'menunggu_verifikasi') {
          Swal.fire('Tidak Bisa Akses', 'Pesanan kamu belum diverifikasi oleh admin.', 'info')
            .then(() => navigate(`/history/${id}`));
          return;
        }

        setOrder(orderData);

        try {
          const confirmRes = await api.get(`/orders/${id}/my-payment-confirmation`);
          const conf = confirmRes.data.data;
          setConfirmation(conf);
          setForm({
            bank_name: conf.bank_name || '',
            account_number: conf.account_number || '',
            transfer_time: conf.transfer_time || '',
            payment_image: null
          });
        } catch {
          setConfirmation(null);
        }

      } catch {
        Swal.fire('Gagal', 'Pesanan tidak ditemukan.', 'error')
          .then(() => navigate('/history'));
      }

      setLoading(false);
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'payment_image') {
      const file = files[0];
      if (file && !file.type.startsWith('image/')) {
        Swal.fire('Format Salah', 'File harus berupa gambar.', 'warning');
        return;
      }
      setForm({ ...form, payment_image: file });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bank_name', form.bank_name);
    formData.append('account_number', form.account_number);
    formData.append('payment_image', form.payment_image);

    try {
      await api.post(`/orders/customer/product/${id}/payment-confirmation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire('Berhasil', 'Konfirmasi pembayaran berhasil dikirim ke admin.', 'success')
        .then(() => navigate(`/history/${id}`));
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan.', 'error');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('_method', 'PUT'); // Ini kunci agar Laravel anggap PUT
    formData.append('bank_name', form.bank_name.trim());
    formData.append('account_number', form.account_number.trim());

    if (form.payment_image) {
      formData.append('payment_image', form.payment_image);
    }

    try {
      const token = localStorage.getItem('token_3');
      await api.post(`/orders/${id}/confirm-payment`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      Swal.fire('Berhasil', 'Konfirmasi pembayaran berhasil diperbarui.', 'success')
        .then(() => {
          setShowModal(false);
          window.location.reload();
        });
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal update konfirmasi.', 'error');
    }
  };

  const handleCancelOrder = async () => {
    try {
      const token = localStorage.getItem('token_3');
      await api.put(`/orders/${id}/cancel`, { note: cancelReason }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      Swal.fire('Dibatalkan', 'Pesanan berhasil dibatalkan.', 'success')
        .then(() => navigate('/history'));
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal membatalkan pesanan.', 'error');
    }
  };

  return (
  <>
    <NavbarCustomer />
    <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
      <Container style={{ maxWidth: '1280px', color: 'white' }}>
        <h2 className="mb-4 text-start">Konfirmasi Pembayaran</h2>

        {loading ? (
          <div className="text-center"><Spinner animation="border" variant="light" /></div>
        ) : (
          <Row>
            {/* Bagian kiri */}
            <Col xs={12} lg={7} className="mb-4">
              <Card style={{ backgroundColor: '#383838', borderRadius: 6, padding: 20, color: '#fff' }}>
                {order && (
                  <div className="mb-3" style={{ textAlign: 'left' }}>
                    <h5 style={{ color: '#ABABAB' }}>Nomor Rekening Tujuan</h5>
                    <h4>{order?.payment_method?.account_number}</h4>
                    <h5 style={{ color: '#ABABAB', marginTop: 10 }}>Atas Nama</h5>
                    <h4>{order?.payment_method?.account_holder}</h4>
                    <h5 style={{ color: '#ABABAB', marginTop: 10 }}>Bank</h5>
                    <h4>{order?.payment_method?.bank_name}</h4>
                    <h5 style={{ color: '#ABABAB', marginTop: 10 }}>Invoice</h5>
                    <h4>{order.invoice_number}</h4>
                    <h5 style={{ color: '#ABABAB', marginTop: 10 }}>Total</h5>
                    <h4>Rp {Number(order.total_price).toLocaleString('id-ID')}</h4>
                  </div>
                )}
              </Card>

              <Card style={{ backgroundColor: '#383838', borderRadius: 6, padding: 24, color: '#fff' }} className="mt-3">
                {order && ['menunggu_verifikasi', 'menunggu_pembayaran'].includes(order.order_status) && (
                  <Button
                    variant="outline-warning"
                    className="w-100"
                    onClick={() => setShowCancelModal(true)}
                  >
                    Batalkan Pesanan
                  </Button>
                )}
                <p style={{ color: '#FFD700', marginTop: 15 }}>
                  <strong>PENTING:</strong> Barang akan diproses ketika pembayaran telah diverifikasi.
                </p>
              </Card>

              {!confirmation && (
                <Card style={{ backgroundColor: '#383838', borderRadius: 6, padding: 24, color: '#fff' }} className="mt-3">
                  <h2 style={{ marginBottom: 15 }}>Cara Pembayaran</h2>
                  <p style={{ color: '#ABABAB' }}>
                    1. Pilih metode transfer bank saat checkout.<br />
                    2. Dapatkan info rekening tujuan di halaman ini.<br />
                    3. Lakukan transfer sesuai nominal tagihan.<br />
                    4. Upload bukti pembayaran ke sistem.<br />
                    5. Admin akan memverifikasi dan memproses pesanan kamu.<br />
                  </p>
                </Card>
              )}
            </Col>

              {/* Bagian kanan (Form Upload) */}
              <Col xs={12} lg={5}>
                <Card
                  style={{
                    backgroundColor: '#383838',
                    borderRadius: 6,
                    padding: 20,
                    color: '#fff',
                    maxWidth: '500px',
                    margin: 'auto',
                    textAlign: 'start',
                  }}
                >
                  {confirmation ? (
                    <>
                      <h5 className="mb-3">Data Konfirmasi Kamu</h5>
                      <p><strong>Nama Bank:</strong> {confirmation.bank_name}</p>
                      <p><strong>No. Rekening:</strong> {confirmation.account_number}</p>
                      <p>
                        <strong>Waktu Transfer:</strong>{' '}
                        {confirmation.transfer_time
                          ? `${new Date(confirmation.transfer_time).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}, ${new Date(confirmation.transfer_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}`
                          : '-'}
                      </p>
                      <p><strong>Bukti Gambar Pembayaran:</strong></p>
                      <img
                        src={confirmation.payment_image}
                        alt="Bukti Pembayaran"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '200px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          objectFit: 'cover',
                        }}
                        onClick={() => setShowProofModal(true)}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />

                      {confirmation?.is_verified === 1 && (
                        <div className="alert alert-success mt-3">✅ Pembayaran Telah Diverifikasi</div>
                      )}

                      {confirmation?.is_verified === 0 && order?.payment_status === 'gagal' && (
                        <div className="alert alert-danger mt-3">
                          ❌ Pembayaran Ditolak oleh Admin
                          {confirmation.note && <><br /><strong>Catatan:</strong> {confirmation.note}</>}
                        </div>
                      )}

                      {confirmation?.is_verified === null && (
                        <>
                          <div className="alert alert-warning mt-3">
                            Pembayaran kamu sedang menunggu verifikasi admin. Jika ada kesalahan, kamu bisa update dulu.
                          </div>
                          {order.order_status === 'menunggu_pembayaran' && order.payment_status === 'sudah_bayar' && (
                            <div className="d-flex justify-content-end mt-3">
                              <Button
                                variant="warning"
                                onClick={() => {
                                  setForm({
                                    bank_name: confirmation.bank_name || '',
                                    account_number: confirmation.account_number || '',
                                    payment_image: null,
                                  });
                                  setShowModal(true);
                                }}
                              >
                                Update Pembayaran
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <h5 className="mb-3">Upload Bukti Pembayaran</h5>
                      <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nama Bank</Form.Label>
                          <Form.Control
                            type="text"
                            name="bank_name"
                            value={form.bank_name}
                            onChange={handleChange}
                            required
                            placeholder="Contoh: BCA"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Nomor Rekening</Form.Label>
                          <Form.Control
                            type="text"
                            name="account_number"
                            value={form.account_number}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label>Bukti Pembayaran</Form.Label>
                          <Form.Control
                            type="file"
                            name="payment_image"
                            accept="image/*"
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>

                        <div className="d-flex justify-content-end">
                          <Button type="submit" variant="warning">Kirim ke Admin</Button>
                        </div>
                      </Form>
                    </>
                  )}
                </Card>
              </Col>
          </Row>
        )}
      </Container>
    </div>

    {/* Modal Update */}
    <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Update Pembayaran</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        <Form onSubmit={handleUpdate}>
          <Form.Group className="mb-3">
            <Form.Label>Nama Bank</Form.Label>
            <Form.Control
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Nomor Rekening</Form.Label>
            <Form.Control
              type="text"
              name="account_number"
              value={form.account_number}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Ganti Bukti Pembayaran (Opsional)</Form.Label>
            <Form.Control
              type="file"
              name="payment_image"
              accept="image/*"
              onChange={handleChange}
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button type="submit" variant="warning">Update</Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>

    {/* Modal Lihat Bukti */}
    <Modal
      show={showProofModal}
      onHide={() => setShowProofModal(false)}
      centered
      size="xl"
      backdrop="static"
      keyboard={true}
    >
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Bukti Pembayaran</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white text-center">
        <img
          src={confirmation?.payment_image}
          alt="Bukti Pembayaran"
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            borderRadius: '8px',
            transition: 'transform 0.3s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />
      </Modal.Body>
    </Modal>

    {/* Modal Konfirmasi Pembatalan */}
    <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>Batalkan Pesanan</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        <p>Apakah kamu yakin ingin membatalkan pesanan ini? Jika iya, kamu bisa menuliskan alasannya di bawah (opsional):</p>
        <Form.Group className="mt-3">
          <Form.Label>Alasan Pembatalan</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Contoh: Saya tidak jadi membeli karena..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="bg-dark text-white">
        <Button variant="secondary" onClick={() => setShowCancelModal(false)}>
          Batal
        </Button>
        <Button variant="danger" onClick={handleCancelOrder}>
          Ya, Batalkan Pesanan
        </Button>
      </Modal.Footer>
    </Modal>

    <FooterCustomer />
  </>
);

};

export default OrderCustomerPaymentPage;
