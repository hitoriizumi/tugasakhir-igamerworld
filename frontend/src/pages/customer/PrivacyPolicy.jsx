import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import AOS from 'aos';
import 'aos/dist/aos.css';

const PrivacyPolicy = () => {
  useEffect(() => {
    AOS.init({ duration: 700, once: true });
  }, []);

  return (
    <>
      <NavbarCustomer />
        <Container fluid style={{ backgroundColor: '#1C1C1C', color: 'white', paddingTop: '100px', paddingBottom: '60px' }}>
            <Container>
            <h2 className="text-warning fw-bold mb-4" data-aos="fade-up">
                Kebijakan Privasi
            </h2>

            <p className="text-light" data-aos="fade-up">
                Kami di <strong>iGamerWorld</strong> sangat menghargai dan menjaga privasi Anda. Halaman ini menjelaskan
                bagaimana informasi pribadi Anda dikumpulkan, digunakan, dan dilindungi saat Anda menggunakan layanan kami.
            </p>

            {[
                {
                title: '1. Informasi yang Kami Kumpulkan',
                text: 'Kami dapat mengumpulkan informasi pribadi seperti nama, email, nomor telepon, dan alamat pengiriman saat Anda mendaftar, melakukan pemesanan, atau mengisi formulir lainnya.'
                },
                {
                title: '2. Penggunaan Informasi',
                text: 'Informasi yang dikumpulkan digunakan untuk memproses pesanan, memberikan layanan pelanggan, mengirimkan pembaruan, serta meningkatkan pengalaman belanja Anda.'
                },
                {
                title: '3. Perlindungan Data',
                text: 'Kami menggunakan langkah-langkah keamanan teknis dan organisasi untuk melindungi data pribadi Anda dari akses yang tidak sah, kehilangan, atau penyalahgunaan.'
                },
                {
                title: '4. Berbagi Informasi',
                text: 'Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Kami hanya membagikan informasi jika diperlukan untuk penyelesaian pesanan dan pemenuhan hukum.'
                },
                {
                title: '5. Cookies',
                text: 'Situs ini menggunakan cookies untuk meningkatkan fungsionalitas dan memberikan pengalaman pengguna yang lebih baik.'
                },
                {
                title: '6. Hak Anda',
                text: 'Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. Silakan hubungi kami jika ingin melakukannya.'
                },
                {
                title: '8. Perubahan Kebijakan',
                text: 'Kebijakan ini dapat diperbarui dari waktu ke waktu. Setiap perubahan akan diinformasikan melalui halaman ini.'
                },
                {
                title: '9. Hak Anda',
                text: 'Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda. Silakan hubungi kami jika ingin melakukannya.'
                }
            ].map((section, idx) => (
                <div key={idx} data-aos="fade-up">
                <h5 className="text-white mt-4">{section.title}</h5>
                <p className="text-secondary">{section.text}</p>
                </div>
            ))}

            <p className="text-light mt-5" data-aos="fade-up">
                Jika Anda memiliki pertanyaan lebih lanjut tentang kebijakan privasi ini, jangan ragu untuk{' '}
                <a href="/hubungi-kami" className="text-warning text-decoration-none">menghubungi kami</a>.
            </p> 
            </Container>
        </Container>
      <FooterCustomer />
    </>
  );
};

export default PrivacyPolicy;
