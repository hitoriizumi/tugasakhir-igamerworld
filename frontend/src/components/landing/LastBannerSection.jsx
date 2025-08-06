import React from 'react';

const LastBannerSection = () => {
  return (
    <section style={{ width: '100%', overflow: 'hidden' }}>
      <img
        src="/image/banner-last.png"
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

export default LastBannerSection;
