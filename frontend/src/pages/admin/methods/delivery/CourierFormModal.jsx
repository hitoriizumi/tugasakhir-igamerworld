import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner, Image } from 'react-bootstrap';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const CourierFormModal = ({ show, onHide, initialData = null, onSuccess }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCode(initialData.code || '');
      setDescription(initialData.description || '');
      setPreview(initialData.image || null);
      setImage(null);
    } else {
      setName('');
      setCode('');
      setDescription('');
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

    if (!name.trim() || !code.trim()) {
      MySwal.fire('Validasi Gagal!', 'Nama dan kode kurir wajib diisi.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('code', code.trim());
      formData.append('description', description.trim());
      if (image) {
        formData.append('image', image);
      }

      if (initialData) {
        await api.put(`/couriers/${initialData.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/couriers', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      MySwal.fire({
        title: 'Berhasil!',
        text: `Kurir berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onHide();
      onSuccess();
    } catch (err) {
      console.error('Gagal simpan kurir:', err);
      MySwal.fire('Gagal!', err.response?.data?.message || 'Gagal menyimpan data kurir.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Modal.Header closeButton>
          <Modal.Title>{initialData ? 'Edit Kurir' : 'Tambah Kurir'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nama Kurir</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama kurir"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Kode Kurir</Form.Label>
            <Form.Control
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="contoh: jne, jnt"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Deskripsi (Opsional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan keterangan tentang kurir ini (jika ada)"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Logo (gambar dari perangkat)</Form.Label>
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

export default CourierFormModal;
