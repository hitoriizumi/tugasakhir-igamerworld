import React, { useState, useEffect } from 'react';
import axios from '@/api/axios';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useSearchParams, Link } from 'react-router-dom';

const ResetPasswordSuperadmin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ success: '', error: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage({ error: 'Token tidak ditemukan. Silakan periksa kembali link reset Anda.' });
    }
  }, [token]);

  const validate = (field, value) => {
    const newErrors = { ...errors };

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      newErrors.email = !emailRegex.test(value) ? 'Format email tidak valid.' : '';
    }

    if (field === 'password') {
      newErrors.password =
        value.length < 8
          ? 'Password minimal 8 karakter.'
          : !/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value) || !/[!@#$%^&*]/.test(value)
          ? 'Harus mengandung huruf besar, kecil, angka & simbol.'
          : '';
    }

    if (field === 'confirmPassword') {
      newErrors.confirmPassword =
        value !== form.password ? 'Konfirmasi password tidak cocok.' : '';
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ error: '', success: '' });

    const hasError = Object.values(errors).some((err) => err);
    if (hasError || !form.email || !form.password || !form.confirmPassword || !token) {
      setMessage({ error: 'Pastikan semua input valid dan token tersedia.' });
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/reset-password', {
        token,
        email: form.email,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });

      setMessage({ success: 'Password berhasil direset. Silakan login kembali.' });
      setForm({ email: '', password: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mereset password.';
      setMessage({ error: msg });
    } finally {
      setLoading(false);
    }
  };

  const isInvalid = (field) => errors[field] && form[field];

  return (
    <Container className="min-vh-100 d-flex justify-content-center align-items-center">
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <Card className="p-4 shadow-sm border-0 rounded-4">
            <h4 className="text-center fw-bold mb-4">Reset Password Superadmin</h4>

            {message.error && <Alert variant="danger">{message.error}</Alert>}
            {message.success && <Alert variant="success">{message.success}</Alert>}

            <Form onSubmit={handleSubmit} noValidate>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  isInvalid={isInvalid('email')}
                  placeholder="Masukkan email superadmin"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password Baru</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  isInvalid={isInvalid('password')}
                  placeholder="Password baru"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Konfirmasi Password Baru</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  isInvalid={isInvalid('confirmPassword')}
                  placeholder="Ulangi password baru"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                type="submit"
                className="w-100"
                style={{ backgroundColor: '#FFD700', border: 'none', color: '#000', fontWeight: 'bold' }}
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Reset Password'}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <small>
                Sudah ingat password?{' '}
                <Link to="/login/superadmin" className="text-decoration-none">
                  Kembali ke Login
                </Link>
              </small>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ResetPasswordSuperadmin;
