import React, { useState, useEffect } from 'react';
import api from '@/api/axiosInstance';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Container, Form, Button, Row, Col, Spinner, Image, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const AddProduct = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);

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
  const [additionalPreviews, setAdditionalPreviews] = useState([]);

  const [loading, setLoading] = useState(false);

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

    const fetchMetadata = async () => {
      try {
        const [catRes, subRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/subcategories'),
          api.get('/brands'),
        ]);

        setCategories(catRes.data.data);
        setSubcategories(subRes.data.data);
        setBrands(brandRes.data.data);
      } catch (err) {
        console.error('Gagal memuat metadata:', err);
        MySwal.fire('Error!', 'Gagal memuat data metadata.', 'error');
      }
    };

    fetchMetadata();
  }, [isAuthorized]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'category_id') {
      const selectedCat = categories.find(cat => cat.id === Number(value));
      const isBundling = selectedCat?.name.toLowerCase().includes('bundling');
      const customBrand = brands.find(b => b.name.toLowerCase() === 'custom');

      setForm(prev => ({
        ...prev,
        category_id: value,
        subcategory_id: '',
        brand_id: isBundling && customBrand ? customBrand.id.toString() : ''
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMainImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMainImage(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    const previews = files.map(file => URL.createObjectURL(file));
    setAdditionalImages(files);
    setAdditionalPreviews(previews);
  };

  const isProcessorComponent = () => {
    const selectedSub = subcategories.find(s => s.id === Number(form.subcategory_id));
    const selectedCat = categories.find(c => c.id === Number(form.category_id));
    return selectedSub?.name === 'Processor' && selectedCat?.name === 'Komponen';
  }; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const totalImages = (mainImage ? 1 : 0) + additionalImages.length;
    if (totalImages > 5) {
      MySwal.fire('Maksimal 5 Gambar!', 'Termasuk gambar utama, maksimal hanya 5 gambar.', 'warning');
      setLoading(false);
      return;
    }

    if (mainImage && mainImage.size > 2 * 1024 * 1024) {
      MySwal.fire('Ukuran Gambar Utama Terlalu Besar!', 'Maksimum 2MB.', 'warning');
      setLoading(false);
      return;
    }

    const oversized = additionalImages.some(file => file.size > 2 * 1024 * 1024);
    if (oversized) {
      MySwal.fire('Ukuran Gambar Tambahan Terlalu Besar!', 'Maksimum 2MB per gambar.', 'warning');
      setLoading(false);
      return;
    }

    try {
      // Tambah produk (dengan main_image)
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });
      formData.append('has_igpu', hasIGPU ? 1 : 0);
      if (mainImage) {
        formData.append('main_image', mainImage);
      }

      const res = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const productId = res.data.data?.id;

      // Tambah gambar tambahan (jika ada)
      if (additionalImages.length > 0 && productId) {
        for (const img of additionalImages) {
          const imgData = new FormData();
          imgData.append('product_id', productId);
          imgData.append('image', img);
          await api.post('/products/images', imgData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      MySwal.fire('Berhasil!', 'Produk berhasil ditambahkan.', 'success')
        .then(() => navigate('/admin/products'));
    } catch (err) {
      console.error('Gagal tambah produk:', err);
      MySwal.fire('Gagal!', err.response?.data?.message || 'Terjadi kesalahan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleZoomImage = (url) => {
    setZoomImageUrl(url);
    setShowZoomModal(true);
  };

  if (!isAuthorized) return null;

  const filteredSubcategories = form.category_id
    ? subcategories.filter(s => s.category_id === Number(form.category_id))
    : [];

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }} className="mb-5">
        <Container>
          <h4 className="mb-4 fw-bold">Tambah Produk Baru</h4>

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
                  <Form.Select name="status_stock" value={form.status_stock} onChange={handleChange}>
                    <option value="pre_order">Pre Order</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select name="category_id" value={form.category_id} onChange={handleChange} required>
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Subkategori</Form.Label>
                  <Form.Select name="subcategory_id" value={form.subcategory_id} onChange={handleChange} required>
                    <option value="">Pilih Subkategori</option>
                    {filteredSubcategories.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
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

                {isProcessorComponent() && (
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
                  <div className="text-danger" style={{ fontSize: '11px' }}>Klik untuk perbesar*</div>
                </div>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Gambar Tambahan (maks. 4)</Form.Label>
              <Form.Control type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} />
              <div className="mt-2 d-flex flex-wrap gap-2">
                {additionalPreviews.map((src, idx) => (
                  <div key={idx} className="position-relative">
                    <Image
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      thumbnail
                      style={{
                        height: '120px',
                        width: '120px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleZoomImage && handleZoomImage(src)}
                    />
                    <div className="text-danger text-center" style={{ fontSize: '11px' }}>Klik untuk perbesar*</div>
                  </div>
                ))}
              </div>
            </Form.Group>

            <Button type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : 'Simpan Produk'}
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

export default AddProduct;
