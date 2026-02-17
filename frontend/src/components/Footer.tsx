import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto w-full border-t border-primary/10 bg-white/50 backdrop-blur-md py-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-black/20 text-[10px] font-black uppercase tracking-[0.4em]">
          Developed by{' '}
          <span className="text-black">G KRISHNA CHAITANYA</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
