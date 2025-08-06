import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Container, Row, Col, Card, Button, Form, Spinner, ProgressBar, Alert, Badge
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { isCustomer } from '@/utils/authHelper';

const CustomPCForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('user_id');

  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem(`custom_pc_step_user_${userId}`);
    return saved ? parseInt(saved) : 1;
  });

  const [selectedComponents, setSelectedComponents] = useState(() => {
    const saved = localStorage.getItem(`custom_pc_selected_components_user_${userId}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedProductDetail, setSelectedProductDetail] = useState(() => {
    const saved = localStorage.getItem(`custom_pc_selected_detail_user_${userId}`);
    return saved ? JSON.parse(saved) : null;
  });

  const [formCheckout, setFormCheckout] = useState(() => {
    const saved = localStorage.getItem(`custom_pc_checkout_data_user_${userId}`);
    return saved ? JSON.parse(saved) : {
      build_by_store: true,
      pickup_method: 'kirim',
      shipping_address_id: '',
      courier_id: '',
      payment_method_id: '',
      note: ''
    };
  });

  const [compatibilities, setCompatibilities] = useState([]);

  useEffect(() => {
    setSelectedProductDetail(null);
    setCurrentPage(1); // optional: reset pagination per step
  }, [currentStep]);


  const stepLabels = [
    'Motherboard', 'Processor', 'GPU', 'RAM',
    'Storage', 'Casing', 'PSU', 'Cooler', 'Checkout'
  ];

  const subcategoryMap = {
    1: 'Motherboard',
    2: 'Processor',
    3: 'GPU',
    4: 'RAM',
    5: 'Storage (SSD / HDD)',
    6: 'Casing',
    7: 'PSU',
    8: 'Cooler'
  };

  const multiSelectSubcategories = ['RAM', 'Storage (SSD / HDD)'];

  const resetProgress = () => {
    Swal.fire({
      title: 'Reset Form Rakitan?',
      text: 'Seluruh pilihan komponen dan data akan dihapus. Lanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, reset!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem(`custom_pc_step_user_${userId}`);
        localStorage.removeItem(`custom_pc_selected_components_user_${userId}`);
        localStorage.removeItem(`custom_pc_selected_detail_user_${userId}`);
        localStorage.removeItem(`custom_pc_checkout_data_user_${userId}`);

        setCurrentStep(1);
        setSelectedComponents({});
        setSelectedProductDetail(null);
        setFormCheckout({
          build_by_store: true,
          pickup_method: 'kirim',
          shipping_address_id: '',
          courier_id: '',
          payment_method_id: '',
          note: ''
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        Swal.fire('Reset Berhasil', 'Progress form rakitan telah diulang.', 'success');
      }
    });
  };


  useEffect(() => {
    AOS.init({ duration: 600 });

    if (!isCustomer()) {
      Swal.fire('Akses Ditolak', 'Silakan login sebagai pelanggan.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    const savedStep = parseInt(localStorage.getItem(`custom_pc_step_user_${userId}`));
    const savedComponents = JSON.parse(localStorage.getItem(`custom_pc_selected_components_user_${userId}`));
    const savedDetail = JSON.parse(localStorage.getItem(`custom_pc_selected_detail_user_${userId}`));
    const savedCheckout = JSON.parse(localStorage.getItem(`custom_pc_checkout_data_user_${userId}`));

    if (savedStep) setCurrentStep(savedStep);
    if (savedComponents) setSelectedComponents(savedComponents);
    if (savedDetail) setSelectedProductDetail(savedDetail);
    if (savedCheckout) setFormCheckout(savedCheckout);

    const fetchAll = async () => {
      try {
        const [prodRes, addrRes, courierRes, payRes, compRes] = await Promise.all([
          api.get('/public/products'),
          api.get('/customer/shipping-addresses'),
          api.get('/public/couriers'),
          api.get('/public/payment-methods'),
          api.get('/public/product-compatibilities-all')
        ]);

        setProducts(prodRes.data.data);
        setAddresses(addrRes.data.data);
        setCouriers(courierRes.data.data);
        setPaymentMethods(payRes.data.data);
        setCompatibilities(compRes.data.data);
      } catch {
        Swal.fire('Gagal', 'Gagal memuat data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [navigate, userId]);

 // Simpan step saat berubah
  useEffect(() => {
    localStorage.setItem(`custom_pc_step_user_${userId}`, currentStep.toString());
  }, [currentStep, userId]);

  // Simpan komponen terpilih
  useEffect(() => {
    localStorage.setItem(`custom_pc_selected_components_user_${userId}`, JSON.stringify(selectedComponents));
  }, [selectedComponents, userId]);

  // Simpan produk yang diklik (detail)
  useEffect(() => {
    if (selectedProductDetail) {
      localStorage.setItem(`custom_pc_selected_detail_user_${userId}`, JSON.stringify(selectedProductDetail));
    } else {
      localStorage.removeItem(`custom_pc_selected_detail_user_${userId}`);
    }
  }, [selectedProductDetail, userId]);

  // Simpan form checkout
  useEffect(() => {
    localStorage.setItem(`custom_pc_checkout_data_user_${userId}`, JSON.stringify(formCheckout));
  }, [formCheckout, userId]);

    const subcategoryNames = Object.values(subcategoryMap);

  const currentSubcategory = subcategoryNames[currentStep - 1];

  const isCompatibleWithAllSelected = useCallback((product) => {
    const selectedIds = Object.values(selectedComponents)
      .flatMap(p => Array.isArray(p) ? p : [p]) // flatten semua produk
      .filter(p => p.id !== product.id) // hindari perbandingan dengan dirinya sendiri
      .map(p => p.id);

    return selectedIds.every(selectedId =>
      compatibilities.some(rel =>
        (rel.product_id === product.id && rel.compatible_with_id === selectedId) ||
        (rel.product_id === selectedId && rel.compatible_with_id === product.id)
      )
    );
  }, [selectedComponents, compatibilities]);



  const filteredProducts = useMemo(() => {
    if (!currentSubcategory || currentStep > 8) return [];

    return products.filter(p => {
      const isCurrent = p.subcategory?.name === currentSubcategory;

      // Step 1: tampilkan semua tanpa cek kompatibilitas
      if (currentStep === 1) {
        return isCurrent &&
          (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      }

      // Step 2 ke atas: harus kompatibel
      return isCurrent &&
        isCompatibleWithAllSelected(p) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [products, currentSubcategory, currentStep, searchTerm, isCompatibleWithAllSelected ]);


  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleSelectProduct = (product) => {
    const subName = product.subcategory?.name;
    if (!subName) return;

    // Selalu tampilkan detail
    setSelectedProductDetail(product);

    // Hanya proses simpan jika tidak out of stock
    if (product.status_stock === 'out_of_stock') return;

    if (multiSelectSubcategories.includes(subName)) {
      // Multiple: tambahkan ke array
      setSelectedComponents(prev => {
        const existing = prev[subName] || [];
        // Cegah duplikat
        if (existing.find(p => p.id === product.id)) return prev;
        return {
          ...prev,
          [subName]: [...existing, { ...product, quantity: 1 }]
        };
      });
    } else {
      // Single: simpan seperti biasa
      setSelectedComponents(prev => ({ ...prev, [subName]: product }));
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      const prevSubcategory = subcategoryNames[prevStep - 1];

      setCurrentStep(prevStep);
      setCurrentPage(1);

      // Hapus komponen di step sebelumnya + detail produk
      setSelectedComponents(prev => {
        const newState = { ...prev };
        delete newState[prevSubcategory];
        return newState;
      });

      setSelectedProductDetail(null);
    }
  };


  const handleNext = () => {
    if (currentStep < stepLabels.length) {
      setCurrentStep(prev => prev + 1);
      setCurrentPage(1); // ✅ reset pagination saat step berubah
    }
  };

  const hasIGPU = selectedComponents['Processor']?.has_igpu === true;
  const isGpuStep = currentStep === 3;
  const isGpuRequired = isGpuStep && !hasIGPU;
  const isGpuSelected = selectedComponents['GPU'];
  const canProceedFromGpu = isGpuRequired ? !!isGpuSelected : true;

  const canProceed = () => {
    const stepSubcategory = subcategoryNames[currentStep - 1];
    const selected = selectedComponents[stepSubcategory];

    // Step GPU (khusus iGPU logic)
    if (currentStep === 3) return canProceedFromGpu;

    // Untuk step 1-8
    if (currentStep >= 1 && currentStep <= 8) {
      if (multiSelectSubcategories.includes(stepSubcategory)) {
        // Multiple select → pastikan array dan length minimal 1
        return Array.isArray(selected) && selected.length > 0;
      } else {
        // Single select → pastikan objek valid
        return !!selected;
      }
    }

    return true; // untuk step checkout (9)
  };

  const renderStep = () => {
    if (currentStep === 9) return null;

    const stepSubcategory = subcategoryNames[currentStep - 1];
    const selectedForStep = selectedComponents[stepSubcategory];

    return (
      <>
        {/* GPU-specific alerts */}
        {isGpuStep && hasIGPU && (
          <Alert variant="info">
            Processor yang kamu pilih memiliki iGPU. Memilih GPU tambahan bersifat opsional.
          </Alert>
        )}
        {isGpuStep && isGpuRequired && !isGpuSelected && (
          <Alert variant="warning">
            Processor yang kamu pilih tidak memiliki iGPU. Kamu wajib memilih GPU untuk lanjut.
          </Alert>
        )}

        {/* RAM & Storage multi-select alert */}
        {multiSelectSubcategories.includes(currentSubcategory) && (
          <Alert variant="info">
            {currentSubcategory === 'RAM' && (
              <>
                Pada step ini, kamu bisa memilih lebih dari satu RAM sesuai kebutuhan.
              </>
            )}
            {currentSubcategory === 'Storage (SSD / HDD)' && (
              <>
                Kamu bisa memilih lebih dari satu storage. Gabungkan SSD dan HDD jika diperlukan.
              </>
            )}
          </Alert>
        )}

        {/* Ringkasan komponen yang sudah dipilih */}
        {Object.entries(selectedComponents).length > 0 && (
          <Alert variant="dark" className="mb-4">
            <div><strong>Komponen yang sudah dipilih:</strong></div>
            <ul style={{ marginBottom: 0, paddingLeft: '1rem' }}>
              {Object.entries(selectedComponents).flatMap(([subcategory, data]) => {
                if (Array.isArray(data)) {
                  return data.map(product => (
                    <li key={`${subcategory}-${product.id}`}>
                      <strong>{subcategory}:</strong> {product.name}
                    </li>
                  ));
                } else {
                  return (
                    <li key={subcategory}>
                      <strong>{subcategory}:</strong> {data.name}
                    </li>
                  );
                }
              })}
            </ul>
          </Alert>
        )}

        {selectedForStep && (
          <Alert variant="success" className="mb-3">
            {multiSelectSubcategories.includes(stepSubcategory) ? (
              <>
                Kamu telah memilih:
                <ul style={{ marginBottom: 0 }}>
                  {selectedForStep.map(product => (
                    <li key={product.id} className="d-flex justify-content-between align-items-center">
                      <div style={{ flex: 1 }}>
                        <span>{product.name}</span>
                        <div className="text-muted small">
                          Stok: {product.stock} &nbsp;|&nbsp;
                          Qty:
                          <Form.Control
                            type="number"
                            size="sm"
                            min={1}
                            max={product.stock}
                            value={product.quantity}
                            style={{ width: 70, display: 'inline-block', marginLeft: 6 }}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (isNaN(value) || value < 1 || value > product.stock) return;

                              setSelectedComponents(prev => {
                                const updated = prev[stepSubcategory].map(p =>
                                  p.id === product.id ? { ...p, quantity: value } : p
                                );
                                return { ...prev, [stepSubcategory]: updated };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => {
                          setSelectedComponents(prev => {
                            const updated = prev[stepSubcategory].filter(p => p.id !== product.id);
                            if (updated.length === 0) {
                              const copy = { ...prev };
                              delete copy[stepSubcategory];
                              return copy;
                            }
                            return {
                              ...prev,
                              [stepSubcategory]: updated
                            };
                          });
                        }}
                      >
                        Hapus
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  Kamu sudah memilih: <strong>{selectedForStep.name}</strong> untuk <strong>{stepSubcategory}</strong>.
                </div>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => {
                    setSelectedComponents(prev => {
                      const newState = { ...prev };
                      delete newState[stepSubcategory];
                      return newState;
                    });
                    setSelectedProductDetail(null);
                  }}
                >
                  Hapus
                </Button>
              </div>
            )}
          </Alert>
        )}

        <Row>
          {/* Kiri: List Produk + Filter + Pagination */}
          <Col lg={6}>
            <Form.Control
              type="text"
              placeholder="Cari nama atau merek..."
              className="mb-3"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />

            {paginatedProducts.map(product => (
              <Card
                key={product.id}
                onClick={() => handleSelectProduct(product)}
                className={`mb-3 ${selectedProductDetail?.id === product.id ? 'border border-warning' : ''}`}
                style={{ backgroundColor: '#2a2a2a', color: 'white', cursor: 'pointer' }}
              >
                <Card.Body>
                  <strong>{product.name}</strong>
                  <div>{formatCurrency(product.price)}</div>
                  <small>{product.brand?.name}</small>
                 
                </Card.Body>
              </Card>
            ))}

            {paginatedProducts.length === 0 && (
              <div
                className="d-flex flex-column align-items-center justify-content-center w-100"
                style={{ minHeight: '50vh', textAlign: 'center' }}
              >
                <img
                  src="/image/notfound.png"
                  alt="Produk tidak ditemukan"
                  style={{ maxWidth: '200px', marginBottom: '1rem' }}
                />
                <div className="alert alert-warning w-auto" style={{ fontSize: '0.95rem' }}>
                  Produk tidak tersedia atau kompatibel. Coba caru atau ubah pilihan sebelumnya.
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between mt-2">
              <Button
                variant="outline-light"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Prev
              </Button>
              <span style={{ color: 'white' }}>
                Halaman {currentPage} dari {Math.ceil(filteredProducts.length / itemsPerPage)}
              </span>
              <Button
                variant="outline-light"
                size="sm"
                disabled={currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </Col>

          {/* Kanan: Detail Produk */}
          <Col lg={6}>
            {selectedProductDetail ? (
              <Card style={{ backgroundColor: '#2a2a2a', color: 'white' }}>
                <Card.Img
                  src={selectedProductDetail.images?.[0]?.image_url || selectedProductDetail.main_image}
                  style={{ height: '300px', objectFit: 'contain', backgroundColor: '#fff' }}
                />
                <Card.Body>
                  {selectedProductDetail.status_stock === 'out_of_stock' && (
                    <Alert variant="info">
                      Produk yang dipilih sedang habis, tidak bisa dipilih. Cari yang lain yuk!
                    </Alert>
                  )}
                  <h5>{selectedProductDetail.name}</h5>
                  <p>
                    <strong>Status Stok:</strong>{' '}
                    <Badge bg={
                      selectedProductDetail.status_stock === 'ready_stock' ? 'success' :
                      selectedProductDetail.status_stock === 'pre_order' ? 'warning' :
                      'secondary'
                    }>
                      {selectedProductDetail.status_stock === 'ready_stock' ? 'Ready Stock' :
                        selectedProductDetail.status_stock === 'pre_order' ? 'Pre-Order' :
                        'Out of Stock'}
                    </Badge>
                  </p>
                  <p><strong>Brand:</strong> {selectedProductDetail.brand?.name}</p>
                  <div dangerouslySetInnerHTML={{ __html: selectedProductDetail.description }} />
                </Card.Body>
              </Card>
            ) : (
              <Alert variant="info">Klik salah satu produk untuk melihat detailnya.</Alert>
            )}
          </Col>
        </Row>
      </>
    );
  };

    const handleCheckoutChange = (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === 'checkbox' ? checked : value;

      if (name === 'pickup_method' && value === 'ambil') {
        setFormCheckout(prev => ({
          ...prev,
          [name]: value,
          shipping_address_id: '',
          courier_id: ''
        }));
      } else {
        setFormCheckout(prev => ({
          ...prev,
          [name]: newValue
        }));
      }
    };

  const handleSubmit = async () => {
    const components = [];

    Object.entries(selectedComponents).forEach(([subcategory, data]) => {
      if (multiSelectSubcategories.includes(subcategory)) {
        data.forEach(product => {
          components.push({ product_id: product.id, quantity: product.quantity || 1 });
        });
      } else if (data) {
        components.push({ product_id: data.id, quantity: 1 });
      }
    });

    const payload = {
      build_by_store: formCheckout.build_by_store,
      pickup_method: formCheckout.pickup_method,
      shipping_address_id:
        formCheckout.pickup_method === 'kirim' ? formCheckout.shipping_address_id : null,
      courier_id: formCheckout.courier_id,
      payment_method_id: formCheckout.payment_method_id,
      note: formCheckout.note,
      components
    };

    try {
      await api.post('/custom-pc-orders', payload);

      // ✅ RESET LOCALSTORAGE & STATE
      localStorage.removeItem(`custom_pc_step_user_${userId}`);
      localStorage.removeItem(`custom_pc_selected_components_user_${userId}`);
      localStorage.removeItem(`custom_pc_selected_detail_user_${userId}`);
      localStorage.removeItem(`custom_pc_checkout_data_user_${userId}`);

      setCurrentStep(1);
      setSelectedComponents({});
      setSelectedProductDetail(null);
      setFormCheckout({
        build_by_store: true,
        pickup_method: 'kirim',
        shipping_address_id: '',
        courier_id: '',
        payment_method_id: '',
        note: ''
      });

      Swal.fire('Berhasil', 'Form rakitan berhasil dikirim!', 'success')
        .then(() => navigate('/history'));
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengirim form rakitan.';
      Swal.fire('Gagal', msg, 'error');
    }
  };

  const renderCheckoutForm = () => (
    <Form className="mt-3">
      <Form.Check
        type="checkbox"
        name="build_by_store"
        label="Ingin dirakit oleh toko?"
        checked={formCheckout.build_by_store}
        onChange={handleCheckoutChange}
      />

      <Form.Group className="mt-3">
        <Form.Label>Metode Pengambilan</Form.Label>
        <Form.Select
          name="pickup_method"
          value={formCheckout.pickup_method}
          onChange={handleCheckoutChange}
        >
          <option value="kirim">Kirim ke alamat</option>
          <option value="ambil">Ambil di toko</option>
        </Form.Select>
      </Form.Group>

      {formCheckout.pickup_method === 'ambil' && (
        <Alert variant="info" className="mt-3">
          Karena kamu memilih <strong>ambil di toko</strong>, maka kamu tidak perlu mengisi alamat pengiriman dan kurir.
        </Alert>
      )}

      {formCheckout.pickup_method === 'kirim' && (
        <>
          <Form.Group className="mt-3">
            <Form.Label>Alamat Pengiriman</Form.Label>
            <Form.Select
              name="shipping_address_id"
              value={formCheckout.shipping_address_id}
              onChange={handleCheckoutChange}
            >
              <option value="">Pilih Alamat</option>
              {addresses.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {addr.recipient_name} - {addr.full_address}
                </option>
              ))}
            </Form.Select>
            {addresses.length === 0 && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline-light"
                  onClick={() => navigate('/customer/address')}
                >
                  Tambah Alamat
                </Button>
              </div>
            )}
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Kurir</Form.Label>
            <Form.Select
              name="courier_id"
              value={formCheckout.courier_id}
              onChange={handleCheckoutChange}
            >
              <option value="">Pilih Kurir</option>
              {couriers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </>
      )}

      <Form.Group className="mt-3">
        <Form.Label>Metode Pembayaran</Form.Label>
        <Form.Select
          name="payment_method_id"
          value={formCheckout.payment_method_id}
          onChange={handleCheckoutChange}
        >
          <option value="">Pilih Metode</option>
          {paymentMethods.map(p => (
            <option key={p.id} value={p.id}>{p.bank_name}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="mt-3">
        <Form.Label>Catatan (opsional)</Form.Label>
        <Form.Control
          as="textarea"
          name="note"
          rows={3}
          value={formCheckout.note}
          onChange={handleCheckoutChange}
        />
      </Form.Group>
    </Form>
  );


  const renderSelectedSummary = () => {
    const flattenComponents = Object.entries(selectedComponents).flatMap(([subcategory, data]) => {
      if (Array.isArray(data)) {
        return data.map(product => ({ subcategory, product }));
      }
      return [{ subcategory, product: data }];
    });

    if (flattenComponents.length === 0) return null;

    // Hitung total dengan validasi price
    const total = flattenComponents.reduce((sum, { product }) => {
      const price = Number(product.price);
      const qty = product.quantity || 1;

      if (isNaN(price)) return sum; // skip produk yang tidak valid
      return sum + price * qty;
    }, 0);

    return (
      <Alert variant="dark" className="mb-4">
        <div><strong>Komponen yang sudah dipilih:</strong></div>
        <ul style={{ marginBottom: 0, paddingLeft: '1rem' }}>
          {flattenComponents.map(({ subcategory, product }) => {
            const price = Number(product.price);
            const qty = product.quantity || 1;

            return (
              <li key={`${subcategory}-${product.id}`}>
                <strong>{subcategory}:</strong> {product.name} × {qty}
                {!isNaN(price) && (
                  <> — <span className="text-muted">{formatCurrency(price * qty)}</span></>
                )}
              </li>
            );
          })}
        </ul>
        <hr />
        <div className="mt-2"><strong>Total Harga Komponen:</strong> {formatCurrency(total)}</div>
      </Alert>
    );
  };

    const formatCurrency = (value) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '1280px', color: 'white' }}>
          <h2 className="mb-4">Form Perakitan PC</h2>
          <div className="stepper-container">
            <div className="step-line-background"></div>
            <div
              className="step-line-progress"
              style={{
                width: `${((currentStep - 1) / (stepLabels.length - 1)) * 100}%`
              }}
            ></div>

            {stepLabels.map((label, index) => {
              const isCompleted = index + 1 < currentStep;
              const isActive = index + 1 === currentStep;

              return (
                <div key={index} className="step-item">
                  <div
                    className={`step-circle ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  />
                  <div className="step-label">{label}</div>
                </div>
              );
            })}
          </div>

          <h5 className="mb-3">{stepLabels[currentStep - 1]}</h5>
          <div className="mb-3 text-end">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={resetProgress}
            >
              Reset Progress
            </Button>
          </div>

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" variant="light" />
            </div>
          ) : (
            <>
              {currentStep === 9 ? (
                <>
                  {renderSelectedSummary()}
                  {renderCheckoutForm()}
                </>
              ) : renderStep()}

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={handlePrev} disabled={currentStep === 1}>
                  Kembali
                </Button>

                {currentStep < stepLabels.length ? (
                  <Button
                    variant="warning"
                    onClick={handleNext}
                    disabled={!canProceed()}
                  >
                    Lanjut
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleSubmit}>
                    Kirim Form Rakitan
                  </Button>
                )}
              </div>
            </>
          )}
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default CustomPCForm;



