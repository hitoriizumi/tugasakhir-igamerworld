import React, { useState } from 'react';
import axios from '@/api/axios';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const RegisterCustomer = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState(null);

  const validate = (field, value) => {
    const newErrors = { ...errors };

    if (field === 'name') {
      newErrors.name = !value.trim() ? 'Nama wajib diisi.' : '';
    }

    if (field === 'username') {
      newErrors.username = !value.trim() ? 'Username wajib diisi.' : '';
    }

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      newErrors.email = !emailRegex.test(value) ? 'Format email tidak valid.' : '';
    }

    if (field === 'password') {
      const password = value;
      const rules = [];
      if (password.length < 8) rules.push('Minimal 8 karakter');
      if (!/[A-Z]/.test(password)) rules.push('Huruf besar');
      if (!/[a-z]/.test(password)) rules.push('Huruf kecil');
      if (!/[0-9]/.test(password)) rules.push('Angka');
      if (!/[@$!%*#?&]/.test(password)) rules.push('Simbol');

      newErrors.password = rules.length > 0
        ? 'Password harus mengandung: ' + rules.join(', ')
        : '';
    }

    if (field === 'phone') {
      newErrors.phone = value && !/^[0-9]+$/.test(value) ? 'Nomor HP hanya boleh angka.' : '';
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const hasError = Object.values(errors).some(err => err);
    if (hasError) return;

    try {
      setServerError(null);
      await axios.post('/api/register', form);
      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
      setServerError(msg);
    }
  };

  const isInvalid = (field) => errors[field] && form[field];

  return (
    <div style={{ backgroundColor: 'black', minHeight: '100vh' }}>
      <Container fluid className="d-flex align-items-center justify-content-center min-vh-100">
        <Row className="w-100" style={{ maxWidth: '1000px' }}>
          {/* Left side: image */}
          <Col md={6} className="d-none d-md-block p-0">
            <div
              style={{
                backgroundImage: 'url(/image/login-image.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100%',
                borderTopLeftRadius: '8px',
                borderBottomLeftRadius: '8px',
              }}
            />
          </Col>

          {/* Right side: form */}
          <Col
            xs={12}
            md={6}
            className="bg-dark text-white p-4 d-flex flex-column justify-content-center"
            style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
          >
            <h3 className="text-center mb-4">Registrasi</h3>

            {serverError && (
              <div className="text-danger text-center mb-3">{serverError}</div>
            )}

            <Form onSubmit={handleRegister} noValidate autoComplete="off">
              <Form.Group className="mb-3">
                <Form.Label>Nama</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  isInvalid={isInvalid('name')}
                  placeholder="Masukkan nama lengkap"
                />
                <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  isInvalid={isInvalid('username')}
                  placeholder="Buat username unik"
                />
                <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  isInvalid={isInvalid('email')}
                  placeholder="contoh@email.com"
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3" style={{ position: 'relative' }}>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  isInvalid={isInvalid('password')}
                  placeholder="Minimal 8 karakter, kombinasi huruf & simbol"
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '38px',
                    right: '10px',
                    cursor: 'pointer',
                    color: '#aaa',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Nomor HP (opsional)</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  isInvalid={isInvalid('phone')}
                  placeholder="08xxxxxxxxxx"
                />
                <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
              </Form.Group>

              <Button
                type="submit"
                className="w-100"
                style={{
                  backgroundColor: '#FFD700',
                  color: '#000',
                  fontWeight: 'bold',
                }}
                disabled={
                  Object.values(errors).some(err => err) ||
                  !form.name || !form.username || !form.email || !form.password
                }
              >
                Daftar
              </Button>

              <div className="text-center mt-3">
                <small>
                  Sudah punya akun?{' '}
                  <Link to="/login" className="text-warning text-decoration-none">
                    Login di sini
                  </Link>
                </small>
              </div>
            </Form>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RegisterCustomer;
