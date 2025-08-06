import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const mediaItems = [
  {
    img: '/image/news-1.png',
    alt: 'RECTmedia',
    link: 'https://rectmedia.com/project/igamerworld/',
  },
  {
    img: '/image/news-2.png',
    alt: 'Metaco',
    link: 'https://metaco.gg/berita/igamerworld-hadirkan-gaming-store-terlengkap-dan-berkualitas-di-indonesia',
  },
  {
    img: '/image/news-3.png',
    alt: 'ONE Esports',
    link: 'https://www.oneesports.id/seputar-game/dekatkan-diri-dengan-komunitas-dan-vendor-igamerworld-hadir-di-jakarta/',
  },
];

const MediaCoverageSection = () => {
  return (
    <section
        style={{
            backgroundImage: 'url("/image/magazine.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            padding: '60px 0',
        }}
        >
      <Container>
        <h4 className="text-warning fw-bold mb-4" data-aos="fade-right">
          Liputan Media
        </h4>
        <Row className="g-4">
          {mediaItems.map((media, idx) => (
            <Col key={idx} xs={12} md={4} data-aos="zoom-in-up">
              <a
                href={media.link}
                target="_blank"
                rel="noopener noreferrer"
                className="d-block overflow-hidden rounded"
                style={{ 
                    transition: 'transform 0.3s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)', 
                }}
              >
                <img
                  src={media.img}
                  alt={media.alt}
                  className="img-fluid w-100"
                  style={{
                    height: '600px',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease-in-out',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              </a>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default MediaCoverageSection;
