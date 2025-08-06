import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner, Image } from 'react-bootstrap';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const BrandFormModal = ({ show, onHide, initialData = null, onSuccess }) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSlug(initialData.slug || '');
      setPreview(initialData.logo || null);
      setLogo(null);
    } else {
      setName('');
      setSlug('');
      setLogo(null);
      setPreview(null);
    }
  }, [initialData, show]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      MySwal.fire({
        title: 'Format Tidak Didukung!',
        text: 'Hanya file JPG, PNG, atau WEBP yang diperbolehkan.',
        icon: 'warning',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      MySwal.fire({
        title: 'Ukuran Terlalu Besar!',
        text: 'Ukuran logo maksimal 2MB.',
        icon: 'warning',
      });
      return;
    }

    setLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim()) {
      MySwal.fire({
        title: 'Validasi Gagal!',
        text: 'Nama dan slug brand wajib diisi.',
        icon: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('slug', slug.trim());
      if (logo) {
        formData.append('logo', logo);
      }

      if (initialData) {
        await api.put(`/brands/${initialData.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/brands', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      MySwal.fire({
        title: 'Berhasil!',
        text: `Brand berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onHide();
      onSuccess();
    } catch (err) {
      console.error('Gagal simpan brand:', err);
      MySwal.fire({
        title: 'Gagal!',
        text: err.response?.data?.message || 'Gagal menyimpan data brand.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} encType="multipart/form-data">
        <Modal.Header closeButton>
          <Modal.Title>{initialData ? 'Edit Brand' : 'Tambah Brand'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nama Brand</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama brand"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Slug</Form.Label>
            <Form.Control
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="contoh: asus, msi"
              required
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

export default BrandFormModal;
