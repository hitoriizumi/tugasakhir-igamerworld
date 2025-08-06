import React, { useEffect } from 'react';
import NavbarCustomer from '@/components/NavbarCustomer';
import FooterCustomer from '@/components/FooterCustomer';
import HeroSection from '@/components/landing/HeroSection';
import CategoryHighlight from '@/components/landing/CategoryHighlight';
import StaticBannerSection from '@/components/landing/StaticBannerSection';
import BrandHighlightSection from '@/components/landing/BrandHighlightSection';
import ProductShowcaseSection from '@/components/landing/ProductShowcaseSection';
import SubcategorySection from '@/components/landing/SubcategorySection';
import LastBannerSection from '@/components/landing/LastBannerSection';
import MediaCoverageSection from '@/components/landing/MediaCoverageSection';
import AOS from 'aos';
import 'aos/dist/aos.css';

const LandingPage = () => {
  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  return (
    <>
      <NavbarCustomer />
      <div style={{ backgroundColor: '#1C1C1C', paddingTop: '90px' }}>
        <HeroSection />
        <CategoryHighlight />
        <StaticBannerSection />
        <BrandHighlightSection />
        <ProductShowcaseSection />
        <SubcategorySection />
        <LastBannerSection />
        <MediaCoverageSection />
      </div>
      <FooterCustomer />
    </>
  );
};

export default LandingPage;
