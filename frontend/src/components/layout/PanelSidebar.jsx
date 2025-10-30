import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const PanelSidebar = ({ items = [], roleLabel='User', user=null, onLogout=null }) => {
  const location = useLocation();
  return (
<aside className="ps-wrap">
      <style>{`
.ps-wrap{position:fixed;inset:0 auto 0 0;width:var(--psw,260px);background:#0b1220;color:#cbd5e1;display:flex;flex-direction:column;box-shadow:8px 0 24px rgba(0,0,0,.24)}
        .ps-inner{display:flex;flex-direction:column;min-height:100%;}
        .ps-head{display:flex;align-items:center;gap:10px;padding:16px;border-bottom:1px solid #111827}
        .ps-logo{width:44px;height:44px;border-radius:10px;background:#fff;padding:6px}
        .ps-title{font-weight:900;letter-spacing:.2px}
        .ps-role{font-size:.75rem;background:#1f2937;color:#fff;border-radius:9999px;padding:3px 8px}
.ps-nav{padding:12px 10px;flex:1;overflow-y:auto}
        .ps-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;color:#cbd5e1;text-decoration:none;font-weight:700;transition:background .15s ease, color .15s ease}
        .ps-link:hover{background:#111827}
        .ps-link.active{background:#1f2937;color:#fff}
        .ps-icon{width:24px;text-align:center}
        .ps-footer{padding:12px;border-top:1px solid #111827}
        .ps-user{display:flex;align-items:center;gap:10px}
        .ps-avatar{width:34px;height:34px;border-radius:9999px;background:#1f2937;display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-weight:800}
        .ps-name{font-weight:800;color:#e5e7eb}
        .ps-email{font-size:.8rem;color:#94a3b8}
        .ps-logout{margin-left:auto;background:#ef4444;color:#fff;border:none;border-radius:10px;padding:6px 10px;font-weight:700;cursor:pointer}
        .ps-logout:hover{filter:brightness(1.05)}
        @media(max-width:1024px){:root{--psw:240px}}
        @media(max-width:640px){:root{--psw:200px}}
      `}</style>
      <div className="ps-inner">
        <div className="ps-head">
        <img className="ps-logo" src="/Images/LOGO.png" alt="Logo" onError={(e)=>{e.currentTarget.style.display='none'}} />
        <div>
          <div className="ps-title">FixItFast</div>
          <div className="ps-role">{roleLabel} Panel</div>
        </div>
      </div>
        <nav className="ps-nav">
        {items.map((it)=> (
          <div key={it.to}>
            <NavLink end={it.end} to={it.to} className={({isActive})=>`ps-link ${isActive ? 'active':''}`}>
              <span className="ps-icon">{it.icon || '•'}</span>
              <span>{it.label}</span>
            </NavLink>
          </div>
        ))}
      </nav>
        <div className="ps-footer">
          <div className="ps-user">
            <div className="ps-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</div>
            <div>
              <div className="ps-name">{user?.name || 'User'}</div>
              <div className="ps-email">{user?.email || ''}</div>
            </div>
            {onLogout && (
              <button className="ps-logout" onClick={onLogout} title="Logout">Logout</button>
            )}
          </div>
          <div style={{marginTop:8}}>
            <small style={{color:'#64748b'}}>© {new Date().getFullYear()} FixItFast</small>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default PanelSidebar;