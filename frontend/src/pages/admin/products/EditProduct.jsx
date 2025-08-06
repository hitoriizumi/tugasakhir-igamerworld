import React, { useState, useEffect } from 'react';
import api from '@/api/axiosInstance';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Container, Form, Button, Row, Col, Spinner, Image, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper'; // ✅ validasi role admin
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker'; // ✅ tracker

const MySwal = withReactContent(Swal);

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = 'http://localhost:8000';

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStock, setCurrentStock] = useState(0);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    status_stock: 'out_of_stock',
    category_id: '',
    subcategory_id: '',
    brand_id: '',
  });

  const [mainImage, setMainImage] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hasIGPU, setHasIGPU] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const [showZoomModal, setShowZoomModal] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Admin.',
        icon: 'error',
      }).then(() => navigate('/login/admin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();
    return () => stopInactivityTracker();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchData = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const detail = res.data.data;
        if (!detail) throw new Error('Produk tidak ditemukan');

        setForm({
          name: detail.name,
          description: detail.description || '',
          price: detail.price,
          status_stock: detail.status_stock,
          category_id: detail.subcategory.category?.id?.toString() || '',
          subcategory_id: detail.subcategory?.id?.toString() || '',
          brand_id: detail.brand?.id?.toString() || '',
        });

        setHasIGPU(detail.has_igpu === 1);

        setCurrentStock(detail.stock || 0);

        if (detail.main_image) {
          setMainImagePreview(detail.main_image);
        }

        const [cats, subs, brands] = await Promise.all([
          api.get('/categories'),
          api.get('/subcategories'),
          api.get('/brands'),
        ]);

        setCategories(cats.data.data);
        setSubcategories(subs.data.data);
        setBrands(brands.data.data);

        const imgRes = await api.get(`/products/${id}/images`);
        setExistingImages(imgRes.data.data);
      } catch (err) {
        console.error('Gagal ambil data:', err);
        MySwal.fire('Error', 'Gagal memuat data produk.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthorized]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category_id') {
      setForm(prev => ({
        ...prev,
        category_id: value,
        subcategory_id: '',
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      MySwal.fire('Ukuran Terlalu Besar!', 'Maksimum 2MB.', 'warning');
      return;
    }
    setMainImage(file);
    setMainImagePreview(URL.createObjectURL(file));
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files)
      .filter(file => file instanceof File) // Tambahan proteksi
      .slice(0, 4);

    const tooBig = files.some(file => file.size > 2 * 1024 * 1024);
    if (tooBig) {
      MySwal.fire('Ukuran Gambar Terlalu Besar!', 'Maksimum 2MB per gambar.', 'warning');
      return;
    }

    setAdditionalImages(files);
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await api.delete(`/products/images/${imageId}`);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      console.error('Gagal hapus gambar:', err);
      MySwal.fire('Error', 'Gagal menghapus gambar.', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const totalGambar = (mainImage ? 1 : 0) + additionalImages.length + existingImages.length;
    if (totalGambar > 5) {
      MySwal.fire('Maksimal 5 Gambar!', 'Termasuk gambar utama dan tambahan.', 'warning');
      setSaving(false);
      return;
    }

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === 'status_stock') {
          formData.append('status_stock', currentStock > 0 ? 'ready_stock' : value);
        } else {
          formData.append(key, value);
        }
      });

      formData.append('has_igpu', hasIGPU ? 1 : 0);

      if (mainImage) formData.append('main_image', mainImage);

      await api.post(`/products/${id}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (additionalImages.length > 0) {
        for (const img of additionalImages) {
          if (!(img instanceof File)) {
            console.warn('Skip non-file data:', img);
            continue;
          }

          const data = new FormData();
          data.append('product_id', id);
          data.append('image', img);

          await api.post('/products/images', data, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        }
      }


      MySwal.fire('Berhasil!', 'Produk berhasil diperbarui.', 'success')
        .then(() => navigate('/admin/products'));
    } catch (err) {
      console.error('Gagal update produk:', err);
      MySwal.fire('Gagal!', err.response?.data?.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized || loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  const handleZoomImage = (url) => {
    setZoomImageUrl(url);
    setShowZoomModal(true);
  };

  const filteredSubcategories = form.category_id
    ? subcategories.filter(s => s.category_id === Number(form.category_id))
    : [];

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />
      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <h4 className="mb-4">Edit Produk</h4>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Produk</Form.Label>
                  <Form.Control name="name" value={form.name} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Harga</Form.Label>
                  <Form.Control type="number" name="price" value={form.price} onChange={handleChange} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Status Stok</Form.Label>
                  <Form.Select
                    name="status_stock"
                    value={currentStock > 0 ? 'ready_stock' : form.status_stock}
                    onChange={handleChange}
                    disabled={currentStock > 0}
                  >
                    {currentStock === 0 && (
                      <>
                        <option value="pre_order">Pre-Order</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </>
                    )}
                    {currentStock > 0 && (
                      <option value="ready_stock">Ready Stock</option>
                    )}
                  </Form.Select>
                  {currentStock > 0 && (
                    <small className="text-muted">
                      Status stok tidak dapat diubah karena stok tersedia ({currentStock} unit). Status otomatis menjadi <strong>Ready Stock</strong>.
                    </small>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select name="category_id" value={form.category_id} onChange={handleChange} required>
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Subkategori</Form.Label>
                  <Form.Select name="subcategory_id" value={form.subcategory_id} onChange={handleChange} required>
                    <option value="">Pilih Subkategori</option>
                    {filteredSubcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Select name="brand_id" value={form.brand_id} onChange={handleChange} required>
                    <option value="">Pilih Brand</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                {(() => {
                  const selectedSub = subcategories.find(s => s.id === Number(form.subcategory_id));
                  const selectedCat = categories.find(c => c.id === Number(form.category_id));
                  const isProcessor = selectedSub?.name === 'Processor' && selectedCat?.name === 'Komponen';
                  return isProcessor;
                })() && (
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Memiliki Grafik Bawaan (iGPU)"
                      checked={hasIGPU}
                      onChange={(e) => setHasIGPU(e.target.checked)}
                    />
                  </Form.Group>
                )}
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Gambar Utama</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleMainImageChange} />
              {mainImagePreview && (
                <div className="mt-2">
                  <small>Preview:</small><br />
                  <Image
                    src={mainImagePreview}
                    thumbnail
                    style={{
                      height: '200px',
                      width: 'auto',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleZoomImage(mainImagePreview)}
                  />
                </div>
              )}
              <div className="text-danger" style={{ fontSize: '11px' }}>Klik untuk perbesar*</div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Gambar Tambahan (maks 4)</Form.Label>
              <Form.Control type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} />
              <div className="mt-2 d-flex flex-wrap gap-2">
                {existingImages.map(img => (
                  <div key={img.id} className="position-relative">
                    <Image
                      src={img.image_url}
                      thumbnail
                      style={{
                        height: '120px',
                        width: '120px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleZoomImage(img.image_url)}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0"
                      onClick={() => handleDeleteImage(img.id)}
                    >×</Button>
                    <div className="text-danger text-center" style={{ fontSize: '11px' }}>Klik untuk perbesar*</div>
                  </div>
                ))}
              </div>
            </Form.Group>

            <Button className='mb-4' variant="success" type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Simpan Perubahan'}
            </Button>
          </Form>
        </Container>
      </div>

      <Modal
        show={showZoomModal}
        onHide={() => setShowZoomModal(false)}
        centered
        size="lg"
      >
        <Modal.Body className="text-center p-0 bg-dark">
          <Image
            src={zoomImageUrl}
            style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default EditProduct;
