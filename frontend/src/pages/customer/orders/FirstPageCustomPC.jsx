import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Container } from 'react-bootstrap';
import { isCustomer } from '@/utils/authHelper';

const FirstPageCustomPC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const handleStartJourney = () => {
    if (!isCustomer()) {
      Swal.fire('Login Diperlukan', 'Silakan login sebagai pelanggan terlebih dahulu.', 'info')
        .then(() => navigate('/login'));
      return;
    }

    navigate('/form/custom-pc');
  };

  return (
    <>
      <NavbarCustomer />

      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          backgroundColor: '#0f0f0f',
          paddingTop: '100px',
          paddingBottom: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Container className="text-center">

          {/* Background image PC */}
          <img
            src="/image/bg-pc.png"
            alt="PC Background"
            data-aos="zoom-in"
            style={{
              maxWidth: '850px',
              width: '90%',
              height: 'auto',
              opacity: 0.2,
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* Judul kiri atas */}
          <h1
            data-aos="fade-right"
            data-aos-delay="200"
            style={{
              position: 'absolute',
              top: '130px',
              left: '80px',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '2.5rem',
              borderBottom: '3px solid #FFD700',
              paddingBottom: '4px',
              zIndex: 2,
            }}
          >
            Build Your Own PC
          </h1>

          {/* Tombol CTA */}
          <div
            data-aos="zoom-in-up"
            data-aos-delay="200"
            onClick={handleStartJourney}
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: 'clamp(24px, 5vw, 48px)',
              cursor: 'pointer',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFD700';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Start Your Journey
          </div>
        </Container>
      </div>

      <FooterCustomer />
    </>
  );
};

export default FirstPageCustomPC;
