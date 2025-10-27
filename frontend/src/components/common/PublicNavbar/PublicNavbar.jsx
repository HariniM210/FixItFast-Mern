import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import './PublicNavbar.css';

const PublicNavbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Language selector removed per request

  return (
    <nav className="app-nav public-nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Home">
          <img src="/Images/LOGO.png" alt="Logo" className="brand-logo" onError={(e)=>{e.currentTarget.style.display='none'}} />
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`}>Register</Link>
          <Link to="/signin" className={`nav-link ${isActive('/signin') ? 'active' : ''}`}>Sign In</Link>
          <Link to="/labour" className={`nav-link ${isActive('/labour') ? 'active' : ''}`}>Labour</Link>
          <Link to="/contact" className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>Contact</Link>
          <Link to="/faq" className={`nav-link ${isActive('/faq') ? 'active' : ''}`}>FAQ</Link>
          <Link to="/about" className={`nav-link ${isActive('/about') ? 'active' : ''}`}>About</Link>
        </div>
        <div className="nav-actions">
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
