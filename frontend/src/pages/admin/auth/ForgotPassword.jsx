import React, { useState } from 'react';
import axios from '@/api/axios';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const ForgotPasswordAdmin = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !validateEmail(email)) {
      setError('Masukkan email yang valid.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/forgot-password', { email });
      setSuccessMsg('Link reset password telah dikirim ke email Anda.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengirim email reset password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="min-vh-100 d-flex justify-content-center align-items-center">
      <Row className="w-100 justify-content-center">
        <Col xs={12} md={6} lg={4}>
          <Card className="p-4 shadow-sm border-0 rounded-4">
            <h4 className="text-center fw-bold mb-4">Lupa Password Admin</h4>

            {successMsg && <Alert variant="success">{successMsg}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Masukkan email admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isInvalid={email && !validateEmail(email)}
                  autoComplete="off"
                />
                <Form.Control.Feedback type="invalid">
                  Format email tidak valid.
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                type="submit"
                className="w-100"
                style={{ backgroundColor: '#FFD700', border: 'none', color: '#000', fontWeight: 'bold' }}
                disabled={loading}
              >
                {loading ? 'Mengirim...' : 'Kirim Link Reset'}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <small>
                Sudah ingat password?{' '}
                <Link to="/login/admin" className="text-decoration-none">
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

export default ForgotPasswordAdmin;
