import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const SubcategoryFormModal = ({ show, onHide, initialData = null, onSuccess }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data);
      } catch (err) {
        console.error('Gagal memuat kategori:', err);
        MySwal.fire({
          title: 'Error!',
          text: 'Gagal memuat daftar kategori.',
          icon: 'error',
        });
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategoryId(initialData.category_id?.toString() || '');
    } else {
      setName('');
      setCategoryId('');
    }
  }, [initialData, show]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !categoryId) {
      MySwal.fire({
        title: 'Validasi Gagal!',
        text: 'Nama subkategori dan kategori wajib diisi.',
        icon: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        category_id: parseInt(categoryId), // pastikan kirim integer
      };

      if (initialData) {
        await api.put(`/subcategories/${initialData.id}`, payload);
      } else {
        await api.post('/subcategories', payload);
      }

      MySwal.fire({
        title: 'Berhasil!',
        text: `Subkategori berhasil ${initialData ? 'diperbarui' : 'ditambahkan'}!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });

      onHide();
      onSuccess();
    } catch (err) {
      console.error('Gagal simpan subkategori:', err);
      MySwal.fire({
        title: 'Gagal!',
        text: err.response?.data?.message || 'Gagal menyimpan data subkategori.',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>{initialData ? 'Edit Subkategori' : 'Tambah Subkategori'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nama Subkategori</Form.Label>
            <Form.Control
              type="text"
              placeholder="Masukkan nama subkategori"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Kategori</Form.Label>
            <Form.Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>Pilih Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Batal
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner size="sm" animation="border" /> : 'Simpan'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SubcategoryFormModal;
