import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import PublicNavbar from '../components/common/PublicNavbar/PublicNavbar';
import Footer from '../components/common/Footer/Footer';

const PublicLayout = () => {
  const location = useLocation();
  const pagesWithoutFooter = ['/','/signin','/register','/admin/login','/admin/change-password','/labour/login'];
  const showFooter = !pagesWithoutFooter.includes(location.pathname);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <PublicNavbar />
      <main style={{ flex:1 }}>
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default PublicLayout;