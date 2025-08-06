import React, { useEffect, useState, useRef } from 'react';
import { Container, Spinner, Card, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from '@/api/axiosInstance';

const ProductShowcaseSection = () => {
  const [readyProducts, setReadyProducts] = useState([]);
  const [preorderProducts, setPreorderProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const readyRef = useRef(null);
  const preOrderRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [readyRes, preorderRes] = await Promise.all([
          axios.get('/public/products?status_stock=ready_stock'),
          axios.get('/public/products?status_stock=pre_order'),
        ]);

        setReadyProducts(readyRes.data.data.slice(0, 8));
        setPreorderProducts(preorderRes.data.data.slice(0, 8));
      } catch (err) {
        console.error('Gagal fetch produk:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const scroll = (ref, direction) => {
    const container = ref.current;
    if (container) {
      const scrollAmount = 220;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const renderProductCard = (product) => {
    const isReady = product.status_stock === 'ready_stock';

    return (
      <Card
        key={product.id}
        data-aos="fade-up"
        data-aos-duration="600"
        data-aos-delay={Math.floor(Math.random() * 100)}
        style={{
          width: 180,
          minWidth: 180,
          backgroundColor: '#2C2C2C',
          color: 'white',
          border: 'none',
          marginRight: 16,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        }}
        onClick={() => navigate(`/produk/${product.id}`)}
      >
        <div style={{ height: 120, overflow: 'hidden' }}>
          <Card.Img
            variant="top"
            src={product.main_image || '/image/placeholder.png'}
            alt={product.name}
            style={{ objectFit: 'cover', height: '100%', width: '100%' }}
          />
        </div>
        <Card.Body style={{ padding: 10 }}>
          <Badge
            bg={isReady ? 'success' : 'warning'}
            text={isReady ? 'light' : 'dark'}
            style={{ fontSize: '0.7rem', marginBottom: 6 }}
          >
            {isReady ? 'Ready Stock' : 'Pre-Order'}
          </Badge>
          <Card.Title
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              lineHeight: '1.2rem',
              marginBottom: 4,
              height: '2.4rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'normal',
            }}
          >
            {product.name}
          </Card.Title>
          <div style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>
            {product.brand?.name || '-'}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#FFD700' }}>
            Rp {Number(product.price).toLocaleString('id-ID')}
          </div>
        </Card.Body>
      </Card>
    );
  };

  const renderCarousel = (products, ref) => (
    <div style={{ position: 'relative' }}>
      {/* Kiri */}
      <Button
        onClick={() => scroll(ref, 'left')}
        style={{
            position: 'absolute',
            left: -16,
            top: '35%',
            zIndex: 2,
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: '1.2rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
        }}
      >
        ‹
      </Button>

      {/* Carousel */}
      <div
        ref={ref}
        style={{
          display: 'flex',
          overflowX: 'auto',
          paddingBottom: 10,
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {products.map(renderProductCard)}
      </div>

      {/* Kanan */}
      <Button
        onClick={() => scroll(ref, 'right')}
        style={{
            position: 'absolute',
            right: -16,
            top: '35%',
            zIndex: 2,
            width: 38,
            height: 38,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#000',
            color: '#fff',
            fontSize: '1.2rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
        }}
        >
        ›
        </Button>
    </div>
  );

  return (
    <section
        style={{
            backgroundImage: `url('/image/bg-produk.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            padding: '40px 0',
        }}
    >
      <Container>
        {loading ? (
          <Spinner animation="border" variant="light" />
        ) : (
          <>
            {/* Ready Stock */}
            <div 
              data-aos="fade-up"
              data-aos-duration="800"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
            >
              <h4 style={{ color: 'black' }}>🔥 Produk Siap Kirim!</h4>
              <span
                onClick={() => navigate('/produk?status_stock=ready_stock')}
                style={{ color: 'black', fontWeight: 500, cursor: 'pointer' }}
              >
                Lihat Semua →
              </span>
            </div>
            {renderCarousel(readyProducts, readyRef)}

            {/* Pre Order */}
            <div 
              data-aos="fade-up"
              data-aos-duration="800"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 16 }}
            >
              <h4 style={{ color: 'black' }}>🕓 Pre-Order Terbaru!</h4>
              <span
                onClick={() => navigate('/produk?status_stock=pre_order')}
                style={{ color: 'black', fontWeight: 500, cursor: 'pointer' }}
              >
                Lihat Semua →
              </span>
            </div>
            {renderCarousel(preorderProducts, preOrderRef)}
          </>
        )}
      </Container>
    </section>
  );
};

export default ProductShowcaseSection;
