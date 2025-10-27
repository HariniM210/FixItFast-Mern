import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="brand-mark">F</div>
          <div>
            <div className="brand-name">FixItFast</div>
            <div className="brand-tag">Making communities better, one complaint at a time.</div>
          </div>
        </div>
        <div className="footer-meta">© {new Date().getFullYear()} FixItFast</div>
      </div>
    </footer>
  );
};

export default Footer;
