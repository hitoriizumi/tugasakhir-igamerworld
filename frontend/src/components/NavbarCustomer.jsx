import React, { useEffect, useState } from 'react';
import {
  Navbar, Container, Nav, Form, Button, FormControl,
  NavDropdown, Dropdown, Badge, Spinner
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Clock, Heart, User, LogOut, Search, Bell
} from 'lucide-react';
import { confirmLogout } from '@/utils/logout';
import { getAllNotificationsFlat } from '@/api/axiosInstance';
import { isCustomer } from '@/utils/authHelper';

const NavbarCustomer = () => {
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // ✅ Cek status login dari helper
  useEffect(() => {
    if (isCustomer()) {
      setName(localStorage.getItem('name') || '');
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/produk?search=${encodeURIComponent(search.trim())}`);
    }
  };

  // ✅ Redirect kalau guest
  const handleGuestRedirect = (path) => {
    if (!isCustomer()) {
      alert('Silakan login terlebih dahulu.');
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifList = await getAllNotificationsFlat();
        const topFive = notifList.slice(0, 5);
        setNotifications(topFive);
        setUnreadCount(notifList.filter(n => !n.is_read).length);
      } catch (err) {
        console.error('Gagal ambil notifikasi:', err);
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoadingNotif(false);
      }
    };

    if (isCustomer()) {
      fetchNotifications();
    }
  }, []);

  const formatRelativeTime = (timestamp) => {
    const created = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 172800) return 'Kemarin';
    return `${Math.floor(diff / 86400)} hari lalu`;
  };

  return (
    <Navbar expand="lg" fixed="top" style={{ backgroundColor: '#1C1C1C' }} className="shadow-sm py-2">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center text-white">
          <img src="/image/logo-icon.png" alt="iGamerWorld" height="50" className="me-2" />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-customer" className="bg-light" />
        <Navbar.Collapse id="navbar-customer">
          <div className="w-100 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mt-3 mt-lg-0">

            <Nav className="flex-column flex-lg-row gap-2 text-white">
              <Nav.Link as={Link} to="/" className="text-white">Home</Nav.Link>
              <Nav.Link as={Link} to="/produk" className="text-white">Produk</Nav.Link>
              <Nav.Link as={Link} to="/custom-pc" className="text-white">Custom PC</Nav.Link>
            </Nav>

            <Form className="d-flex mx-lg-2 w-50 w-lg-50" onSubmit={handleSearch}>
              <FormControl
                type="search"
                placeholder="Search Here......"
                className="rounded-start"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                type="submit"
                className="rounded-end mx-1"
                style={{
                  backgroundColor: '#FFD700',
                  color: '#000',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                <Search size={20} />
              </Button>
            </Form>

            <Nav className="d-flex flex-row align-items-center gap-2 text-white">
              <Nav.Link onClick={() => handleGuestRedirect('/keranjang')} className="text-white p-1" title="Keranjang">
                <ShoppingCart size={20} />
              </Nav.Link>

              <Nav.Link onClick={() => handleGuestRedirect('/history')} className="text-white p-1" title="Riwayat Pesanan">
                <Clock size={20} />
              </Nav.Link>

              <Nav.Link onClick={() => handleGuestRedirect('/wishlist')} className="text-white p-1" title="Wishlist">
                <Heart size={20} />
              </Nav.Link>

              {isLoggedIn && (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="dark" className="position-relative border-0 bg-transparent shadow-none p-1">
                    <Bell size={20} color="white" />
                    {unreadCount > 0 && (
                      <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                        {unreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                    <div className="fw-bold px-3 pt-2 pb-1 border-bottom">Notifikasi</div>

                    {loadingNotif ? (
                      <div className="text-center py-3">
                        <Spinner animation="border" size="sm" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-3 text-muted">Tidak ada notifikasi</div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="px-3 py-2 text-wrap"
                          style={{
                            backgroundColor: notif.is_read ? 'white' : '#f8f9fa',
                            borderBottom: '1px solid #eee',
                            fontSize: '0.88rem'
                          }}
                        >
                          <div className={`mb-1 ${!notif.is_read ? 'fw-bold' : ''}`} style={{ color: '#333' }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>
                            {formatRelativeTime(notif.created_at)}
                          </div>
                        </div>
                      ))
                    )}

                    <div className="border-top">
                      <Link to="/customer/notifications" className="d-block text-center py-2 fw-semibold text-warning">
                        Lihat Semua Notifikasi
                      </Link>
                    </div>
                  </Dropdown.Menu>
                </Dropdown>
              )}

              {isLoggedIn ? (
                <NavDropdown
                  title={
                    <span className="d-flex align-items-center gap-1 text-white">
                      <span style={{ fontSize: '1.2rem' }}>🙂</span>
                      Hello, {name}
                      <span>▼</span>
                    </span>
                  }
                  align="end"
                  className="no-caret"
                  menuVariant="light"
                >
                  <NavDropdown.Item as={Link} to="/profile">My Account</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/customer/addresses">Address Book</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={() => confirmLogout('/login')} className="text-danger d-flex align-items-center gap-2">
                    <LogOut size={16} /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Button as={Link} to="/login" variant="outline-warning" size="sm">
                  Login
                </Button>
              )}
            </Nav>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarCustomer;
