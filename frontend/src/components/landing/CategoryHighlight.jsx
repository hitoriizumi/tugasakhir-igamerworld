import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './CategoryHighlight.css'; // Custom style untuk efek blur

const CategoryHighlight = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      name: 'KOMPONEN',
      description: 'Komponen berkualitas tinggi untuk membangun sistem yang handal',
      image: '/image/kategori-1.png',
    },
    {
      id: 2,
      name: 'AKSESORIS',
      description: 'Beragam aksesoris komputer untuk meningkatkan kenyamanan',
      image: '/image/kategori-2.png',
    },
    {
      id: 3,
      name: 'PC BUNDLING',
      description: 'Nikmati paket lengkap bundling PC dengan harga spesial',
      image: '/image/kategori-3.png',
    },
  ];

  const handleClick = (id) => {
    navigate(`/produk?category_id=${id}`);
  };

  return (
    <div
      className="category-highlight-section"
      style={{
        backgroundImage: 'url(/image/categories.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '40px',
        paddingBottom: '40px',
      }}
    >
      <Container>
        <Row className="justify-content-evenly gx-2 gy-4">
          {categories.map((cat, index) => (
             <Col
              key={cat.id}
              xs={12}
              sm={6}
              md={4}
              className="d-flex justify-content-center px-1"
              data-aos="fade-up"
              data-aos-delay={index * 200}
              data-aos-duration="800"
            >
              <Card
                className="category-card glass-card text-white"
                onClick={() => handleClick(cat.id)}
                style={{
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '340px',
                  minHeight: '320px',
                  border: 'none',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  backgroundColor: 'transparent',
                }}
              >
                <Card.Img
                  variant="top"
                  src={cat.image}
                  alt={cat.name}
                  style={{ objectFit: 'contain', height: '200px' }}
                />
                <Card.Body style={{ backgroundColor: 'transparent', padding: '10px 20px' }}>
                  <Card.Title className="fw-bold" style={{ fontSize: '1.3rem', color: 'white' }}>
                    {cat.name}
                  </Card.Title>
                  <Card.Text style={{ fontSize: '0.9rem' }}>
                    {cat.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default CategoryHighlight;
