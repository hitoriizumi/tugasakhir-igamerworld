import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { ThumbsUp, Wallet, PackageSearch, ShieldCheck } from 'lucide-react';

const AboutUs = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <>
      <NavbarCustomer />
      <Container fluid style={{ backgroundColor: '#1C1C1C', color: 'white', paddingTop: '100px', paddingBottom: '60px' }}>
        {/* Section: Hero */}
        <Container className="mb-5">
          <Row className="align-items-center" data-aos="fade-up">
            <Col md={6} className="mb-4 mb-md-0">
              <h2 className="fw-bold">Tentang Kami</h2>
              <p className="text-warning fw-semibold">
                iGamerWorld Surabaya menghadirkan produk-produk elektronik komputer berkualitas dari brand-brand ternama
                seperti Notebook, Desktop PC, Komponen PC Rakitan, Komponen PC, Printer, UPS, Gadget, Smartphone dan ratusan jenis produk aksesoris elektronik komputer.
              </p>
              <p>
                Dengan mengedepankan kualitas produk, layanan penjualan, dan after-sales service, kami senantiasa berusaha untuk terus memaksimalkan pengalaman belanja Anda.
              </p>
              <p>
                Didukung oleh staf profesional yang terlatih, kami siap membantu menemukan produk yang sesuai dengan kebutuhan Anda.
              </p>
            </Col>
            <Col md={6}>
              <img src="/image/about-us.png" alt="Tentang Kami" className="img-fluid rounded" />
            </Col>
          </Row>
        </Container>

        {/* Section: Lokasi Toko */}
        <Container className="mb-5">
          <Row className="align-items-center" data-aos="fade-up">
            <Col md={6}>
              <img src="/image/location-image.png" alt="Lokasi Toko" className="img-fluid rounded" />
            </Col>
            <Col md={6}>
              <h4 className="fw-bold">Lokasi Toko Kami</h4>
              <p className="mb-1">Mangga Dua Mall Lt.3 No. 31-32 Jakarta Pusat 10730</p>
              <p>Selain pembelian langsung di toko, kami juga melayani pembelian online via transfer bank dan pengiriman via ekspedisi.</p>
                <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
                    <img src="/image/logo-jne.png" alt="JNE" className="ekspedisi-logo" />
                    <img src="/image/logo-jnt.png" alt="J&T" className="ekspedisi-logo" />
                    <img src="/image/logo-shopee.jpg" alt="ShopeeXpress" className="ekspedisi-logo" />
                    <img src="/image/logo-go-send.png" alt="GoSend" className="ekspedisi-logo" />
                    <img src="/image/logo-grab.png" alt="Grab" className="ekspedisi-logo" />
                    <img src="/image/logo-anteraja.png" alt="AnterAja" className="ekspedisi-logo" />
                </div>
            </Col>
          </Row>
        </Container>

        {/* Section: Mengapa Memilih Kami */}
        <Container>
          <h4 className="text-center fw-bold mb-4" data-aos="fade-up">Mengapa Memilih iGamerWorld?</h4>
          <p className="text-center text-white mb-5" data-aos="fade-up">
            Nikmati berbagai kemudahan berbelanja komputer bersama kami.
          </p>
          <Row className="g-4 mb-4">
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <ThumbsUp size={40} className="mx-auto mb-3 text-warning" />
                <h6>Produk Unggulan</h6>
                <p className="small">Menyediakan produk brand unggulan dengan kualitas terbaik.</p>
              </Card>
            </Col>
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <Wallet size={40} className="mx-auto mb-3 text-warning" />
                <h6>Harga Kompetitif</h6>
                <p className="small">Harga ter-update dan bersaing dengan harga pasaran.</p>
              </Card>
            </Col>
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <PackageSearch size={40} className="mx-auto mb-3 text-warning" />
                <h6>Beragam Brand</h6>
                <p className="small">Menghadirkan merek ternama & berkualitas pilihan.</p>
              </Card>
            </Col>
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <ShieldCheck size={40} className="mx-auto mb-3 text-warning" />
                <h6>Tepercaya</h6>
                <p className="small">Kami kembalikan uang jika barang tidak terkirim.</p>
              </Card>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <ThumbsUp size={40} className="mx-auto mb-3 text-warning" />
                <h6>Produk Unggulan</h6>
                <p className="small">Menyediakan produk brand unggulan dengan kualitas terbaik.</p>
              </Card>
            </Col>
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <Wallet size={40} className="mx-auto mb-3 text-warning" />
                <h6>Harga Kompetitif</h6>
                <p className="small">Harga ter-update dan bersaing dengan harga pasaran.</p>
              </Card>
            </Col>
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <PackageSearch size={40} className="mx-auto mb-3 text-warning" />
                <h6>Beragam Brand</h6>
                <p className="small">Menghadirkan merek ternama & berkualitas pilihan.</p>
              </Card>
            </Col>
            <Col md={6} lg={3} data-aos="fade-up">
              <Card className="h-100 text-center bg-dark border-secondary text-white p-3">
                <ShieldCheck size={40} className="mx-auto mb-3 text-warning" />
                <h6>Tepercaya</h6>
                <p className="small">Kami kembalikan uang jika barang tidak terkirim.</p>
              </Card>
            </Col>
          </Row>
        </Container>
      </Container>
      <FooterCustomer />
    </>
  );
};

export default AboutUs;
