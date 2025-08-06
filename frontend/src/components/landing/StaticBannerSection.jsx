import React from 'react';

const StaticBannerSection = () => {
  return (
    <section style={{ width: '100%', overflow: 'hidden' }}>
      <img
        src="/image/banner-static.png"
        alt="Static Section Banner"
        style={{
          width: '100%',
          height: '50vh',
          objectFit: 'contain',
          backgroundColor: 'black',
          display: 'block',
        }}
      />
    </section>
  );
};

export default StaticBannerSection;
