import React, { useState } from 'react';
import axios from '@/api/axios';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { saveAuthData } from '@/utils/authHelper';
import { Eye, EyeOff } from 'lucide-react'; 

const MySwal = withReactContent(Swal);

const AdminLogin = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (field, value) => {
    const newErrors = { ...errors };

    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      newErrors.email = !emailRegex.test(value) ? 'Format email tidak valid.' : '';
    }

    if (field === 'password') {
      newErrors.password = value.length < 6 ? 'Password minimal 6 karakter.' : '';
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const isInvalid = (field) => errors[field] && form[field];

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);

    const hasError = Object.values(errors).some((err) => err);
    if (hasError || !form.email || !form.password) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('/api/login', {
        email: form.email,
        password: form.password,
        expected_role: 2,
      });

      const { access_token, role_id, name } = res.data;

      if (role_id === 2) {
        saveAuthData('2', access_token, { name });

        await MySwal.fire({
          title: 'Login Berhasil!',
          text: 'Selamat datang Admin!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });

        window.location.href = '/admin/dashboard';
      } else {
        setServerError('Akses ditolak. Anda bukan admin.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Email atau password salah.';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Container fluid className="d-flex align-items-center justify-content-center min-vh-100">
        <Row className="w-100" style={{ maxWidth: '900px' }}>
          {/* Left: Image */}
          <Col md={6} className="d-none d-md-block p-0">
            <div
              style={{
                backgroundImage: 'url(/image/login-admin.png)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                height: '100%',
              }}
            />
          </Col>

          {/* Right: Form */}
          <Col
            xs={12}
            md={6}
            className="d-flex flex-column justify-content-center"
          >
            <div className="border p-4 rounded-3 shadow-sm">
              <h3 className="text-center mb-4 fw-bold">Login Admin</h3>

              {serverError && (
                <div className="text-danger text-center mb-3">{serverError}</div>
              )}

              <Form onSubmit={handleLogin} noValidate autoComplete="off">
                <Form.Group className="mb-3">
                  <Form.Label className="text-dark">email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="type your email"
                    value={form.email}
                    onChange={handleChange}
                    isInvalid={isInvalid('email')}
                  />
                  <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4" style={{ position: 'relative' }}>
                  <Form.Label className="text-dark">password</Form.Label>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="type your password"
                    value={form.password}
                    onChange={handleChange}
                    isInvalid={isInvalid('password')}
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
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100"
                  disabled={
                    loading ||
                    Object.values(errors).some((err) => err) ||
                    !form.email ||
                    !form.password
                  }
                  style={{
                    backgroundColor: '#007BFF',
                    color: '#fff',
                    fontWeight: 'bold',
                  }}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
