import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from '@/api/axiosInstance';
import * as LucideIcons from 'lucide-react';

const SubcategorySection = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await axios.get('/public/subcategories');
        setSubcategories(res.data.data);
      } catch (error) {
        console.error('Gagal mengambil subkategori:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubcategories();
  }, []);

  const handleClick = (id) => {
    navigate(`/produk?subcategory_id=${id}`);
  };

  return (
    <section
        style={{
            background: 'linear-gradient(to bottom, #1C1C1C, black)',
            padding: '60px 0',
        }}
        >
      <Container>
        <h4
          data-aos="fade-up"
          data-aos-duration="800"
          style={{ color: '#FFD700', marginBottom: '30px' }}>
          Sub Kategori
        </h4>
        {loading ? (
          <Spinner animation="border" variant="light" />
        ) : (
          <Row className="gy-4">
            {subcategories.map((sub, index) => {
              const IconComponent = LucideIcons[sub.icon_name] || LucideIcons.Box;

              return (
                <Col 
                  xs={6} sm={4} md={3} lg={2} key={sub.id}
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                  data-aos-duration="600"
                >
                  <div
                    onClick={() => handleClick(sub.id)}
                    style={{
                      backgroundColor: '#0f0f0f',
                      borderRadius: '10px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      textAlign: 'center',
                      minHeight: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div
                      style={{
                        backgroundColor: '#FFD700',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 10px',
                      }}
                    >
                      <IconComponent color="black" size={28} />
                    </div>
                    <div style={{ color: 'white', fontWeight: 'bold', minHeight: '40px' }}>{sub.name}</div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>
                      {sub.products_count ?? 0} Produk
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Container>
    </section>
  );
};

export default SubcategorySection;
