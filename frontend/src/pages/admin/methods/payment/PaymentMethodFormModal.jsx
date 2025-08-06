import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner, Image } from 'react-bootstrap';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const PaymentMethodFormModal = ({ show, onHide, initialData = null, onSuccess }) => {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBankName(initialData.bank_name || '');
      setAccountNumber(initialData.account_number || '');
      setAccountHolder(initialData.account_holder || '');
      setPreview(initialData.image || null);
      setImage(null);
    } else {
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      setImage(null);
      setPreview(null);
    }
  }, [initialData, show]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      MySwal.fire('Format Tidak Didukung!', 'Hanya JPG, PNG, atau WEBP yang diperbolehkan.', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      MySwal.fire('Ukuran Terlalu Besar!', 'Ukuran gambar maksimal 2MB.', 'warning');
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!bankName.trim()) {
      MySwal.fire('Validasi Gagal!', 'Nama bank atau metode wajib diisi.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('bank_name', bankName.trim());
      formData.append('account_number', accountNumber.trim());
      formData.append('account_holder', accountHolder.trim());
      if (image) {
        formData.append('image', image);
      }

      if (initialData) {
        await api.put(`/payment-methods/${initialData.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/payment-methods', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      MySwal.fire({
        title: 'Berhasil!',
        text: `Metode pembayaran berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onHide();
      onSuccess();
    } catch (err) {
      console.error('Gagal simpan metode pembayaran:', err);
      MySwal.fire('Gagal!', err.response?.data?.message || 'Gagal menyimpan data metode pembayaran.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Modal.Header closeButton>
          <Modal.Title>{initialData ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nama Bank / Metode</Form.Label>
            <Form.Control
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="contoh: BCA, COD, Dana"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Nomor Rekening (opsional)</Form.Label>
            <Form.Control
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="contoh: 1234567890"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Atas Nama (opsional)</Form.Label>
            <Form.Control
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="contoh: PT Contoh Indonesia"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Logo / Gambar Metode</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {preview && (
              <div className="mt-2">
                <small className="text-muted">Preview:</small><br />
                <Image src={preview} height="70" rounded />
              </div>
            )}
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PaymentMethodFormModal;
