import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const FooterCustomer = () => {
  return (
    <footer className="footer-customer bg-warning text-dark pt-5 pb-4" style={{ marginBottom: 0, overflow: 'hidden' }}>
      <Container>
        <Row className="gy-4">
          <Col xs={12} md={6} lg={2}>
            <h6 className="fw-bold">Tentang Kami</h6>
            <ul className="list-unstyled">
              <li><Link to="/tentang-kami" className="text-dark text-decoration-none">Tentang Kami</Link></li>
              <li><Link to="/kebijakan-privasi" className="text-dark text-decoration-none">Kebijakan Privasi</Link></li>
              <li><Link to="/syarat-ketentuan" className="text-dark text-decoration-none">Syarat & Ketentuan</Link></li>
            </ul>
          </Col>

          <Col xs={12} md={6} lg={2}>
            <h6 className="fw-bold">Bantuan</h6>
            <ul className="list-unstyled">
              <li><Link to="/feedback" className="text-dark text-decoration-none">Feedback</Link></li>
            </ul>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <h6 className="fw-bold">Customer Care</h6>
            <ul className="list-unstyled small">
              <li>📍 Grand Galaxy City, Ruko Sentra Niaga Blok RSN 3 No 18, Jaka Setia</li>
              <li>🗓️ Senin - Sabtu, 10:00 - 18:00 WIB</li>
              <li>📱 081295736010 (Message Only)</li>
              <li>📧 <a href="mailto:igamerworldsby@gmail.com" className="text-dark">igamerworldsby@gmail.com</a></li>
              <li>🌐 <a href="https://www.igamerworld.com" className="text-dark" target="_blank" rel="noopener noreferrer">Website iGamerWorld</a></li>
            </ul>
          </Col>

          <Col xs={12} md={6} lg={3}>
            <h6 className="fw-bold">Toko Kami</h6>
            <ul className="list-unstyled small">
              <li>📍 Jl. Klampis Aji I No.19, Klampis Ngasem, Kec. Sukolilo, Surabaya, Jawa Timur 60117</li>
              <li>🕙 Setiap Hari, 10:00 - 18:00 WIB</li>
              <li>📱 081310766339 (WA Message Only)</li>
              <li>☎️ 021 30430333</li>
              <li>📧 <a href="mailto:sales@enterkomputer.com" className="text-dark">sales@enterkomputer.com</a></li>
            </ul>
          </Col>

          <Col xs={12} md={6} lg={2}>
            <h6 className="fw-bold">Metode Pembayaran</h6>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <img src="/image/logo-bca.png" alt="BCA" className="pay-logo" />
              <img src="/image/logo-bni.png" alt="Mandiri" className="pay-logo" />
              <img src="/image/logo-bri.png" alt="Permata" className="pay-logo" />
              <img src="/image/logo-mandiri.png" alt="MasterCard" className="pay-logo" />
            </div>
          </Col>

          {/* <Col xs={12} className="mt-4">
            <Row className="g-4">
              <Col xs={12} md={6} lg={4}>
                <h6 className="fw-bold">Metode Pengiriman</h6>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <img src="/image/jne.png" alt="JNE" height="30" />
                  <img src="/image/jnt.png" alt="JNT" height="30" />
                  <img src="/image/sicepat.png" alt="SiCepat" height="30" />
                  <img src="/image/grab.png" alt="Grab" height="30" />
                  <img src="/image/gosend.png" alt="GoSend" height="30" />
                </div>
              </Col>

              <Col xs={12} md={6} lg={4}>
                <h6 className="fw-bold">Metode Pembayaran</h6>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <img src="/image/logo-bca.png" alt="BCA" className="pay-logo" />
                  <img src="/image/logo-bni.png" alt="Mandiri" className="pay-logo" />
                  <img src="/image/logo-bri.png" alt="Permata" className="pay-logo" />
                  <img src="/image/logo-jenius.png" alt="VISA" className="pay-logo" />
                  <img src="/image/logo-mandiri.png" alt="MasterCard" className="pay-logo" />
                  <img src="/image/logo-paypal.png" alt="MasterCard" className="pay-logo" />
                  <img src="/image/logo-qris.png" alt="MasterCard" className="pay-logo" />
                </div>
              </Col>

              <Col xs={12} md={6} lg={4}>
                <h6 className="fw-bold">Unduh Aplikasi</h6>
                <div className="d-flex gap-2">
                  <img src="/image/google-play.png" alt="Google Play" height="40" />
                  <img src="/image/app-store.png" alt="App Store" height="40" />
                </div>
              </Col>
            </Row>
          </Col> */}
        </Row>

        <hr className="my-4" />

        <Row className="align-items-center">
          <Col xs={12} md={6} className="text-center text-md-start mb-3 mb-md-0">
            <img src="/image/logo.png" alt="iGamerWorld Logo" style={{ height: '40px', maxWidth: '100%' }} />
          </Col>
          <Col xs={12} md={6} className="text-center text-md-end">
            <small>
              &copy; 2024 <strong>iGamerWorld</strong>. All Rights Reserved.
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default FooterCustomer;
