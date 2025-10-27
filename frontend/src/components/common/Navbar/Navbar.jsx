import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher';
import './Navbar.css';

const Navbar = () => {
  const { user: regularUser, logout: regularLogout } = useAuth();
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminArea = location.pathname.startsWith('/admin');
  const isLabourArea = location.pathname.startsWith('/labour');

  // Decide which identity and logout to use, scoped to area to avoid cross-over
  const { user, logout } = useMemo(() => {
    try {
      if (isLabourArea) {
        if (regularUser?.role === 'labour') return { user: regularUser, logout: regularLogout };
        const cached = JSON.parse(localStorage.getItem('labourUser') || 'null');
        if (cached) return { user: cached, logout: regularLogout };
        if (regularUser?.role) return { user: regularUser, logout: regularLogout };
        return { user: null, logout: regularLogout };
      }
      if (isAdminArea) {
        if (admin?.role === 'admin' || admin?.role === 'superadmin') return { user: admin, logout: adminLogout };
        const cached = JSON.parse(localStorage.getItem('adminUser') || 'null');
        if (cached) return { user: cached, logout: adminLogout };
        return { user: null, logout: adminLogout };
      }
      if (regularUser && regularUser.role !== 'labour') return { user: regularUser, logout: regularLogout };
      const cached = JSON.parse(localStorage.getItem('user') || 'null');
      return { user: cached, logout: regularLogout };
    } catch {
      return { user: regularUser || admin || null, logout: admin ? adminLogout : regularLogout };
    }
  }, [isAdminArea, isLabourArea, regularUser, admin, regularLogout, adminLogout]);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  // Language selector removed per request

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Home">
          <img src="/Images/LOGO.png" alt="Logo" className="brand-logo" onError={(e)=>{e.currentTarget.style.display='none'}} />
        </Link>

        <div className="nav-links">
          {isLabourArea ? (
            <>
              <Link to="/labour/dashboard" className={`nav-link ${isActive('/labour/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/labour/assigned-complaints" className={`nav-link ${isActive('/labour/assigned-complaints') ? 'active' : ''}`}>Assigned Complaints</Link>
              <Link to="/labour/attendance" className={`nav-link ${isActive('/labour/attendance') ? 'active' : ''}`}>Attendance</Link>
              <Link to="/labour/profile" className={`nav-link ${isActive('/labour/profile') ? 'active' : ''}`}>Profile</Link>
            </>
          ) : isAdminArea ? (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/admin/manage-complaints" className={`nav-link ${isActive('/admin/manage-complaints') ? 'active' : ''}`}>Manage Complaints</Link>
              <Link to="/admin/assign-complaint" className={`nav-link ${isActive('/admin/assign-complaint') ? 'active' : ''}`}>Assign Complaints</Link>
              <Link to="/admin/assigned-status" className={`nav-link ${isActive('/admin/assigned-status') ? 'active' : ''}`}>Assigned Status</Link>
              <Link to="/admin/labours" className={`nav-link ${isActive('/admin/labours') ? 'active' : ''}`}>Labour Details</Link>
              <Link to="/admin/create-labour" className={`nav-link ${isActive('/admin/create-labour') ? 'active' : ''}`}>Create Labour</Link>
              <Link to="/admin/attendance" className={`nav-link ${isActive('/admin/attendance') ? 'active' : ''}`}>Attendance</Link>
              <Link to="/admin/profile" className={`nav-link ${isActive('/admin/profile') ? 'active' : ''}`}>Profile</Link>
              {user?.role === 'superadmin' && (
                <>
                  <Link to="/admin/super-dashboard" className={`nav-link ${isActive('/admin/super-dashboard') ? 'active' : ''}`}>Super Dashboard</Link>
                  <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>Manage Users</Link>
                  <Link to="/admin/admins" className={`nav-link ${isActive('/admin/admins') ? 'active' : ''}`}>Manage Admins</Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <Link to="/lodge-complaint" className={`nav-link ${isActive('/lodge-complaint') ? 'active' : ''}`}>Lodge Complaint</Link>
              <Link to="/track-status" className={`nav-link ${isActive('/track-status') ? 'active' : ''}`}>Track Status</Link>
              <Link to="/my-complaints" className={`nav-link ${isActive('/my-complaints') ? 'active' : ''}`}>My Complaints</Link>
              <Link to="/community-feed" className={`nav-link ${isActive('/community-feed') ? 'active' : ''}`}>Feedback</Link>
              <Link to="/citizen/profile" className={`nav-link ${isActive('/citizen/profile') ? 'active' : ''}`}>Profile</Link>
            </>
          )}
        </div>

        <div className="nav-actions">
          <ThemeSwitcher />
          <span className="welcome">Welcome, {user?.name || 'Guest'}</span>
          {user && (
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
