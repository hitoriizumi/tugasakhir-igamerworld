import React from 'react';
import { Carousel } from 'react-bootstrap';

const HeroSection = () => {
  const banners = [
    '/image/banner-1.png',
    '/image/banner-2.png',
    '/image/banner-3.png',
  ];

  return (
    <section style={{ height: '90vh', overflow: 'hidden' }}>
      <Carousel indicators={true} controls={true} interval={4000}>
        {banners.map((src, idx) => (
          <Carousel.Item key={idx}>
            <div
              style={{
                height: '90vh',
                width: '100%',
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '100%',
                //   backgroundColor: 'rgba(0, 0, 0, 0.5)', // Optional overlay
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
    </section>
  );
};

export default HeroSection;
