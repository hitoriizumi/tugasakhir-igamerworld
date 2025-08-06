import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import AOS from 'aos';
import 'aos/dist/aos.css';

const TermsAndConditions = () => {
  useEffect(() => {
    AOS.init({ duration: 700, once: true });
  }, []);

  return (
    <>
      <NavbarCustomer />
       <Container fluid style={{ backgroundColor: '#1C1C1C', color: 'white', paddingTop: '100px', paddingBottom: '60px' }}>
        <Container>
          <h2 className="text-warning fw-bold mb-4" data-aos="fade-up">
            Syarat & Ketentuan
          </h2>

          <p className="text-light" data-aos="fade-up">
            Selamat datang di <strong>iGamerWorld</strong>. Dengan mengakses dan menggunakan situs kami, Anda menyetujui
            untuk mematuhi syarat dan ketentuan berikut ini.
          </p>

          {[
            {
              title: '1. Informasi Umum',
              text: 'Konten yang disediakan di situs ini bersifat informatif dan dapat berubah sewaktu-waktu tanpa pemberitahuan.'
            },
            {
              title: '2. Akun Pengguna',
              text: 'Anda bertanggung jawab menjaga kerahasiaan informasi akun dan aktivitas yang dilakukan melalui akun Anda.'
            },
            {
              title: '3. Harga & Ketersediaan',
              text: 'Harga produk dapat berubah sewaktu-waktu. Kami berusaha menjaga ketersediaan stok, namun tidak menjamin produk selalu tersedia.'
            },
            {
              title: '4. Proses Pemesanan',
              text: 'Pemesanan dianggap sah setelah pembayaran diterima dan dikonfirmasi oleh sistem kami.'
            },
            {
              title: '5. Pengiriman',
              text: 'Pengiriman dilakukan melalui ekspedisi pilihan dan estimasi waktu tergantung lokasi tujuan.'
            },
            {
              title: '6. Pengembalian & Garansi',
              text: 'Kebijakan pengembalian berlaku sesuai dengan ketentuan garansi dan kondisi produk.'
            },
            {
              title: '7. Batasan Tanggung Jawab',
              text: 'Kami tidak bertanggung jawab atas kerusakan atau kehilangan akibat penggunaan layanan di luar kendali kami.'
            },
            {
              title: '8. Perubahan Syarat',
              text: 'Kami berhak mengubah syarat & ketentuan ini kapan saja. Perubahan akan diinformasikan melalui situs ini.'
            }
          ].map((section, idx) => (
            <div key={idx} data-aos="fade-up">
              <h5 className="text-white mt-4">{section.title}</h5>
              <p className="text-secondary">{section.text}</p>
            </div>
          ))}

          <p className="text-light mt-5" data-aos="fade-up">
            Dengan menggunakan situs ini, Anda dianggap telah membaca dan menyetujui seluruh syarat dan ketentuan yang berlaku.
            Jika ada pertanyaan, silakan <a href="/hubungi-kami" className="text-warning text-decoration-none">hubungi kami</a>.
          </p>  
        </Container>
          
        </Container>
      <FooterCustomer />
    </>
  );
};

export default TermsAndConditions;
