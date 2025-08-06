import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authHelper';

const CartPage = () => {
  const navigate = useNavigate();
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  const fetchCarts = useCallback(async () => {
    try {
      const res = await api.get('/cart');
      setCarts(res.data.data);
    } catch {
      Swal.fire('Gagal', 'Gagal memuat data keranjang', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    AOS.init({ duration: 600 });

    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    fetchCarts();
  }, [fetchCarts, navigate]);

  const updateQuantity = async (cartId, quantity) => {
    if (quantity < 1) {
      Swal.fire('Peringatan', 'Minimal jumlah produk adalah 1.', 'info');
      return;
    }

    try {
      await api.put(`/cart/${cartId}`, { quantity });
      fetchCarts();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal memperbarui jumlah', 'error');
    }
  };

  const incrementQty = (item) => {
    const maxQty = item.product.status_stock === 'ready_stock' ? item.product.stock : 999;
    if (item.quantity >= maxQty) {
      Swal.fire('Peringatan', 'Jumlah melebihi stok tersedia.', 'info');
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  };

  const decrementQty = (item) => {
    if (item.quantity <= 1) {
      Swal.fire('Peringatan', 'Minimal jumlah adalah 1. Gunakan tombol hapus untuk menghapus produk.', 'info');
      return;
    }
    updateQuantity(item.id, item.quantity - 1);
  };

  const deleteCart = async (cartId) => {
    const confirm = await Swal.fire({
      title: 'Hapus produk ini dari keranjang?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/cart/${cartId}`);
        fetchCarts();
      } catch {
        Swal.fire('Gagal', 'Tidak dapat menghapus produk', 'error');
      }
    }
  };

  const handleCheckboxChange = (id, checked) => {
    setSelectedItems(prev =>
      checked ? [...prev, id] : prev.filter(itemId => itemId !== id)
    );
  };

  const toggleSelectAll = () => {
    const ids = [...groupedCarts.pre_order, ...groupedCarts.ready_stock].map(i => i.id);
    if (selectedItems.length === ids.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(ids);
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      Swal.fire('Peringatan', 'Pilih minimal 1 produk untuk checkout.', 'info');
      return;
    }

    navigate('/checkout', {
      state: {
        cart_ids: selectedItems
      }
    });
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  // Group berdasarkan status
  const groupedCarts = {
    pre_order: [],
    ready_stock: [],
    out_of_stock: [],
  };

  carts.forEach(cart => {
    const status = cart.product.status_stock;
    if (status === 'pre_order') groupedCarts.pre_order.push(cart);
    else if (status === 'ready_stock') groupedCarts.ready_stock.push(cart);
    else groupedCarts.out_of_stock.push(cart);
  });

  const totalPrice = [...groupedCarts.pre_order, ...groupedCarts.ready_stock]
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const renderCartItem = (item, disabled = false) => (
    <div key={item.id}
      className="d-flex align-items-center justify-content-between mb-3 p-3 rounded"
      style={{
        backgroundColor: disabled ? '#444' : '#2a2a2a',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <Form.Check
        type="checkbox"
        disabled={disabled}
        checked={selectedItems.includes(item.id)}
        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
        style={{
          marginRight: '20px'
        }}
      />
      <img
        src={item.product.images[0]?.image_url || item.product.main_image}
        alt={item.product.name}
        style={{
          width: '80px',
          height: '80px',
          objectFit: 'cover', // ini penting agar gambar "crop" rapih
          borderRadius: '5px',
          backgroundColor: '#fff' // opsional biar nggak kelihatan bolong
        }}
      />
      <div className="ms-3 flex-grow-1">
        <h6 className="mb-1">{item.product.name}</h6>
        <p className="mb-1">{formatCurrency(item.product.price)}</p>
        <Badge bg={
          item.product.status_stock === 'ready_stock' ? 'success' :
          item.product.status_stock === 'pre_order' ? 'warning' : 'secondary'
        }>
          {item.product.status_stock.replace(/_/g, ' ').toUpperCase()}
        </Badge>
        {item.product.status_stock === 'pre_order' && (
          <p style={{ fontSize: '0.85rem', marginTop: '4px', color: '#ccc' }}>
            Perkiraan waktu tiba menyesuaikan dari supplier.
          </p>
        )}
      </div>
      <div className="d-flex align-items-center gap-2 px-2">
        <Button variant="outline-light" size="sm" onClick={() => decrementQty(item)} disabled={disabled}>-</Button>
        <span>{item.quantity}</span>
        <Button variant="outline-light" size="sm" onClick={() => incrementQty(item)} disabled={disabled}>+</Button>
      </div>
      <Button variant="danger" size="sm" onClick={() => deleteCart(item.id)} disabled={disabled}>
        Hapus
      </Button>
    </div>
  );

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
          <Container style={{ maxWidth: '1280px', color: 'white', margin: '0 auto' }}>
          <h2 className="mb-4">Keranjang Belanja</h2>
          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : carts.length === 0 ? (
            <p>Keranjang Anda kosong.</p>
          ) : (
            <Row>
              <Col md={8}>
                <Button variant="outline-light" className="mb-3" onClick={toggleSelectAll}>
                  {selectedItems.length === [...groupedCarts.pre_order, ...groupedCarts.ready_stock].length ? 'Batalkan Semua' : 'Pilih Semua'}
                </Button>

                {groupedCarts.pre_order.length > 0 && (
                  <>
                    <h5 className="text-warning mb-3">Pre Order</h5>
                    {groupedCarts.pre_order.map(item => renderCartItem(item))}
                  </>
                )}

                {groupedCarts.ready_stock.length > 0 && (
                  <>
                    <h5 className="text-success mt-4 mb-3">Ready Stock</h5>
                    {groupedCarts.ready_stock.map(item => renderCartItem(item))}
                  </>
                )}

                {groupedCarts.out_of_stock.length > 0 && (
                  <>
                    <h5 
                    className="mt-4 mb-3"
                    style={{ color: '#848484' }}
                    >Out of Stock</h5>
                    {groupedCarts.out_of_stock.map(item => renderCartItem(item, true))}
                  </>
                )}
              </Col>

              <Col md={4}>
                <div className="p-4 rounded" style={{ backgroundColor: '#2f2f2f' }}>
                  <h5 className='text-center'>Total Pesanan</h5>
                  <hr />
                  <p>Harga: <strong>{formatCurrency(totalPrice)}</strong></p>
                  <Button
                    variant="warning" 
                    className="w-100 mt-2" 
                    onClick={handleCheckout} 
                    disabled={selectedItems.length === 0}
                    >
                    Checkout
                  </Button>
                  <hr />
                  <p style={{ fontSize: '12px', color: 'white' }}>
                    Shipping fee will be calculated when checkout
                  </p>
                  <p style={{ fontSize: '12px', color: 'white', marginTop: '5px' }}>
                    If choosing DP as payment option, shipping fee will be invoiced when the item is arrived.
                  </p>
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default CartPage;
