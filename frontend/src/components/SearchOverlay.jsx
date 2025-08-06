import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SearchOverlay = ({ onClose }) => {
  const [keyword, setKeyword] = useState('');
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('search_history')) || [];
    setHistory(stored);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const updatedHistory = [trimmed, ...history.filter(k => k !== trimmed)].slice(0, 10);
    localStorage.setItem('search_history', JSON.stringify(updatedHistory));
    navigate(`/produk?search=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleKeywordClick = (term) => {
    navigate(`/produk?search=${encodeURIComponent(term)}`);
    onClose();
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 bg-white" style={{ zIndex: 1050 }}>
      <div className="d-flex align-items-center p-3 border-bottom">
        <button className="btn p-0 me-3" onClick={onClose} aria-label="Tutup">
          <ArrowLeft size={24} />
        </button>
        <form onSubmit={handleSearch} className="w-100">
          <input
            type="text"
            className="form-control border-0"
            placeholder="Khilaf apa hari ini?"
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </form>
      </div>

      <div className="p-3">
        <div className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>Riwayat</div>
        {history.length === 0 ? (
          <div className="text-muted">Belum ada riwayat pencarian.</div>
        ) : (
          <ul className="list-unstyled m-0">
            {history.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleKeywordClick(item)}
                  className="btn btn-link text-start p-0 text-dark mb-2"
                  style={{ textDecoration: 'none' }}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
