import React from 'react';
import { useLocation } from 'react-router-dom';

const AppHeader = ({ onToggleSidebar, title = 'FixItFast', rightSlot = null }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isLabour = location.pathname.startsWith('/labour');

  return (
    <header className="ff-header">
      <style>{`
        .ff-header{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:linear-gradient(135deg,#1e3a8a 0%,#4338ca 100%);color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}
        .ff-header .brand{display:flex;align-items:center;gap:10px;font-weight:900;letter-spacing:.2px}
        .ff-header .brand img{width:40px;height:40px;border-radius:10px;background:#fff;padding:4px}
        .ff-actions{display:flex;align-items:center;gap:10px}
        .ff-burger{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.12);border:none;color:#fff;cursor:pointer}
        .ff-title{font-size:1.05rem;font-weight:800}
        .ff-chip{font-size:.78rem;background:rgba(255,255,255,.14);padding:3px 8px;border-radius:9999px}
        @media(min-width:1024px){.ff-burger{display:none}}
      `}</style>
      <button className="ff-burger" onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>
      <div className="brand">
        <img src="/Images/LOGO.png" alt="Logo" onError={(e)=>{e.currentTarget.style.display='none'}} />
        <div>
          <div className="ff-title">{title}</div>
          <div className="ff-chip">{isAdmin ? 'Admin' : isLabour ? 'Labour' : 'User'} Panel</div>
        </div>
      </div>
      <div className="ff-actions">
        {rightSlot}
      </div>
    </header>
  );
};

export default AppHeader;