import React, { useState } from 'react';
import axios from '@/api/axios';
import { Container, Row, Col, Form, Button, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { saveAuthData } from '@/utils/authHelper';
import { Eye, EyeOff } from 'lucide-react';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const MySwal = withReactContent(Swal);
  const [loading, setLoading] = useState(false);

  const handleValidation = () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email wajib diisi.';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Format email tidak valid.';
    if (!password.trim()) errs.password = 'Password wajib diisi.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;
    setLoading(true);

    try {
      const res = await axios.post('/api/login', {
        email,
        password,
        expected_role: 3,
      });

      const { access_token, role_id, name, id } = res.data;

      if (role_id === 3) {
        saveAuthData('3', access_token, { name, id });

        await MySwal.fire({
          icon: 'success',
          title: 'Berhasil Login!',
          text: 'Selamat datang kembali 👋',
          timer: 2000,
          showConfirmButton: false,
        });

        navigate('/');
      } else {
        MySwal.fire({
          icon: 'error',
          title: 'Akses Ditolak',
          text: 'Anda bukan pelanggan.',
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Email atau password salah.';
      MySwal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: msg,
      });
    } finally {
      setLoading(false);
    }
  };

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
            <h3 className="text-center mb-4">Login</h3>

            <Form onSubmit={handleLogin} autoComplete="off">
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  placeholder="Enter email"
                  onChange={(e) => setEmail(e.target.value)}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-2" style={{ position: 'relative' }}>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  placeholder="Kata Sandi"
                  onChange={(e) => setPassword(e.target.value)}
                  isInvalid={!!errors.password}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <div
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    top: '38px',
                    right: '10px',
                    cursor: 'pointer',
                    color: '#aaa',
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
                <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
              </Form.Group>

              <div className="text-end mb-3">
                <Link to="/customer/auth/forgot-password" className="text-warning" style={{ fontSize: '0.9rem' }}>
                  Forgot Password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-100"
                style={{ backgroundColor: '#FFD700', color: '#000', fontWeight: 'bold' }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Login'}
              </Button>

              <div className="text-center mt-3">
                <small>
                  Don’t have account?{' '}
                  <Link to="/register" className="text-warning text-decoration-none">
                    Click here!
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

export default CustomerLogin;
