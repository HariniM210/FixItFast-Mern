import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const AppSidebar = ({ open, onClose, items = [] }) => {
  const location = useLocation();
  return (
    <aside className={`ff-side ${open ? 'open' : ''}`}>
      <style>{`
        .ff-side{position:fixed;z-index:50;inset:0 40% 0 0;transform:translateX(-100%);transition:transform .2s ease;backdrop-filter:none}
        .ff-side.open{transform:translateX(0)}
        .ff-side .panel{width:260px;height:100%;background:#0b1220;color:#cbd5e1;box-shadow:8px 0 24px rgba(0,0,0,.24)}
        .ff-nav{padding:14px}
        .ff-group{margin:10px 0}
        .ff-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;color:#cbd5e1;text-decoration:none;font-weight:700}
        .ff-link:hover{background:#111827}
        .ff-link.active{background:#1f2937;color:#fff}
        .ff-icon{width:24px;text-align:center}
        @media(min-width:1024px){.ff-side{transform:none;inset:auto auto auto 0}.ff-overlay{display:none}.ff-side .panel{width:260px}}
        .ff-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4)}
      `}</style>
      <div className="ff-overlay" onClick={onClose} style={{display: open ? 'block' : 'none'}} />
      <div className="panel">
        <nav className="ff-nav">
          {items.map((it)=> (
            <div className="ff-group" key={it.to}>
              <NavLink end={it.end} to={it.to} className={({isActive})=>`ff-link ${isActive ? 'active':''}`} onClick={onClose}>
                <span className="ff-icon">{it.icon || '•'}</span>
                <span>{it.label}</span>
              </NavLink>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;