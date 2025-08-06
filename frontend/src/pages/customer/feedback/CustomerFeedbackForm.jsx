import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Spinner } from 'react-bootstrap';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axiosInstance';
import Swal from 'sweetalert2';
import AOS from 'aos';
import 'aos/dist/aos.css';
import StarRatings from 'react-star-ratings';
import { isCustomer } from '@/utils/authHelper';

const CustomerFeedbackForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: '',
    message: '',
    rating: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 600 });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCustomer()) {
      Swal.fire('Harus Login', 'Silakan login terlebih dahulu untuk mengirim feedback.', 'warning')
        .then(() => navigate('/login'));
      return;
    }

    if (form.rating < 1 || form.rating > 5) {
      Swal.fire('Peringatan', 'Silakan beri rating bintang dari 1–5.', 'info');
      return;
    }

    try {
      setLoading(true);
      await api.post('/feedbacks', form);
      Swal.fire('Terkirim', 'Feedback Anda berhasil dikirim.', 'success')
        .then(() => {
          setForm({ subject: '', message: '', rating: 0 });
          navigate('/');
        });
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Gagal mengirim feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh' }}>
        <Container style={{ maxWidth: '720px', color: 'white' }}>
          <h2 className="mb-4 text-center">Kirim Feedback untuk Website</h2>

          <Form onSubmit={handleSubmit} data-aos="fade-up">
            <Form.Group className="mb-3">
              <Form.Label>Subjek</Form.Label>
              <Form.Control
                type="text"
                placeholder="Masukkan subjek feedback"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Pesan / Kritik / Saran</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                placeholder="Tulis pesan atau saran Anda di sini"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <div>
                <StarRatings
                  rating={form.rating}
                  starRatedColor="#ffc107"
                  changeRating={(value) => setForm({ ...form, rating: value })}
                  numberOfStars={5}
                  name="rating"
                  starDimension="30px"
                  starSpacing="5px"
                />
              </div>
            </Form.Group>

            <div className="text-center mt-4">
              <Button
                type="submit"
                variant="warning"
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Kirim Feedback'}
              </Button>
            </div>
          </Form>
        </Container>
      </div>
      <FooterCustomer />
    </>
  );
};

export default CustomerFeedbackForm;
