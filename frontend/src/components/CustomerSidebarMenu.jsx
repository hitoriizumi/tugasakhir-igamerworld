import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, X, Clock, Heart, MapPin, User } from 'lucide-react';

const CustomerSidebarMenu = ({ name, isLoggedIn, onClose, confirmLogout }) => {
  const username = localStorage.getItem('username') || 'guest';

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
      onClick={onClose}
    >
      <div
        className="bg-white h-100 p-4 d-flex flex-column"
        style={{
          maxWidth: '85%',
          width: '300px',
          animation: 'slideIn 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-semibold">Account</h5>
          <button className="btn p-0" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="d-flex flex-column align-items-start mb-4">
          <div
            className="rounded-circle bg-secondary mb-2"
            style={{ width: '56px', height: '56px' }}
          ></div>
          <div className="fw-bold fs-6">{name || 'Guest'}</div>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>@{username}</div>
        </div>

        {/* Menu Items */}
        <div className="d-flex flex-column gap-3 flex-grow-1">
          <Link to="/history" className="text-dark d-flex align-items-center gap-2 text-decoration-none">
            <Clock size={18} /> <span>Order History</span>
          </Link>
          <Link to="/wishlist" className="text-dark d-flex align-items-center gap-2 text-decoration-none">
            <Heart size={18} /> <span>Wishlist</span>
          </Link>
          <Link to="/customer/addresses" className="text-dark d-flex align-items-center gap-2 text-decoration-none">
            <MapPin size={18} /> <span>Address Book</span>
          </Link>
          <Link to="/profile" className="text-dark d-flex align-items-center gap-2 text-decoration-none">
            <User size={18} /> <span>My Account</span>
          </Link>
        </div>

        {/* Logout */}
        {isLoggedIn && (
          <div className="mt-4 border-top pt-3">
            <button
              className="btn btn-link text-danger d-flex align-items-center gap-2 text-decoration-none"
              onClick={() => confirmLogout('/login')}
            >
              <LogOut size={18} /> <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Animasi */}
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CustomerSidebarMenu;
