import React, { useEffect, useState } from 'react';
import DashboardNavbar from '@/components/DashboardNavbar';
import DashboardSidebar from '@/components/DashboardSidebar';
import { Container, Tab, Tabs, Spinner } from 'react-bootstrap';
import BrandList from './brands/BrandList';
import SubcategoryList from './subcategories/SubcategoryList';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '@/utils/authHelper';
import { startInactivityTracker, stopInactivityTracker } from '@/utils/inactivityTracker';

const MySwal = withReactContent(Swal);

const MetadataDashboard = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAdmin()) {
      MySwal.fire({
        title: 'Akses Ditolak!',
        text: 'Halaman ini hanya untuk Admin.',
        icon: 'error',
      }).then(() => navigate('/login/admin'));
      return;
    }

    setIsAuthorized(true);
    startInactivityTracker();
    return () => stopInactivityTracker();
  }, [navigate]);

  if (!isAuthorized) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <DashboardSidebar />
      <DashboardNavbar redirectLogout="/login/admin" />

      <div style={{ paddingLeft: '80px', paddingTop: '90px', minHeight: '100vh' }}>
        <Container>
          <h4 className="mb-4 fw-bold">Manajemen Metadata Produk</h4>

          <Tabs
            defaultActiveKey="brand"
            id="metadata-tabs"
            className="mb-3"
            justify
            variant="pills"
          >
            <Tab eventKey="brand" title="Brand">
              <BrandList />
            </Tab>
            <Tab eventKey="subcategory" title="Subkategori">
              <SubcategoryList />
            </Tab>
          </Tabs>
        </Container>
      </div>
    </>
  );
};

export default MetadataDashboard;
