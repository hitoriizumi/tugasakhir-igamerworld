import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from '@/api/axiosInstance';

const BrandHighlightSection = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/public/brands')
      .then((res) => {
        setBrands(res.data.data);
      })
      .catch((err) => {
        console.error('Gagal memuat data brand:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleClick = (id) => {
    navigate(`/produk?brand_id=${id}`);
  };

  return (
    <section
        style={{
            background: 'linear-gradient(to bottom, black, #1c1c1c)',
            padding: '40px 0',
        }}
        >
      <Container>
        <Row>
          {/* KIRI - Official Brands */}
          <Col md={9}>
            <div
              data-aos="fade-right"
              data-aos-duration="1000"
              style={{
                background: 'linear-gradient(to right, #1a1a1a, #000)',
                padding: '25px',
                borderRadius: '10px',
                height: '100%',
              }}
            >
              <h5 style={{ color: '#FFD700', marginBottom: '20px' }}>Official Brands</h5>
              {loading ? (
                <Spinner animation="border" variant="light" />
              ) : (
                <Row className="gy-4">
                  {brands.map((brand, index) => (
                    <Col key={brand.id} 
                      xs={4} sm={3} md={2} 
                      className="d-flex justify-content-center" 
                      data-aos="zoom-in"
                      data-aos-delay={index * 100}
                      data-aos-duration="600"
                    >
                      <div
                        onClick={() => handleClick(brand.id)}
                        style={{
                          width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                            transition: 'transform 0.2s ease-in-out',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          style={{
                                width: '120%',           
                                height: '120%',
                                objectFit: 'cover',       
                                objectPosition: 'center', 
                            }}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </div>
          </Col>

          {/* KANAN - E-commerce */}
          <Col 
            md={3} 
            className="mt-4 mt-md-0"
            data-aos="fade-left"
            data-aos-duration="1000"
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                padding: '20px',
                borderRadius: '10px',
              }}
            >
              <h5 style={{ color: '#FFD700', marginBottom: '15px' }}>E-commerce</h5>
              <a
                    href="https://www.tokopedia.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', marginBottom: '15px' }}
                >
                    <img
                    src="/image/marketplace-tokopedia.png"
                    alt="Tokopedia"
                    style={{
                        width: '100%',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                </a>

                <a
                    href="https://shopee.co.id/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                    src="/image/marketplace-shopee.png"
                    alt="Shopee Mall"
                    style={{
                        width: '100%',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                </a>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default BrandHighlightSection;
