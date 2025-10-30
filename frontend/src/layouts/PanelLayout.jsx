import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import PanelSidebar from '../components/layout/PanelSidebar';

const PanelLayout = () => {
  const location = useLocation();
  const userCtx = (()=>{ try { return useAuth(); } catch { return { isAuthenticated:false, user:null, logout:null }; }})();
  const adminCtx = (()=>{ try { return useAdminAuth(); } catch { return { isAuthenticated:false, admin:null, adminLogout:null }; }})();
  const isAdminArea = location.pathname.startsWith('/admin');
  const isLabourArea = location.pathname.startsWith('/labour');

  const roleLabel = isAdminArea ? (adminCtx?.admin?.role === 'superadmin' ? 'SuperAdmin' : 'Admin') : (isLabourArea ? 'Labour' : 'User');

  const adminItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/manage-complaints', label: 'Manage Complaints', icon: '📝' },
    { to: '/admin/assign-complaint', label: 'Assign', icon: '📌' },
    { to: '/admin/attendance', label: 'Attendance', icon: '🕒' },
    { to: '/admin/labours', label: 'Labours', icon: '🛠️' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/feedback-report', label: 'Feedback Report', icon: '📊' },
    { to: '/admin/profile', label: 'Profile', icon: '👤' },
  ];
  const userItems = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/lodge-complaint', label: 'Lodge Complaint', icon: '📝' },
    { to: '/track-status', label: 'Track Status', icon: '📍' },
    { to: '/my-complaints', label: 'My Complaints', icon: '📚' },
    { to: '/community-feed', label: 'Feedback', icon: '💬' },
    { to: '/citizen/profile', label: 'Profile', icon: '👤' },
  ];
  const labourItems = [
    { to: '/labour/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/labour/assigned-complaints', label: 'Assigned', icon: '📌' },
    { to: '/labour/attendance', label: 'Attendance', icon: '🕒' },
    { to: '/labour/profile', label: 'Profile', icon: '👤' },
  ];

  const items = isAdminArea ? adminItems : (isLabourArea ? labourItems : userItems);

  const sidebarUser = isAdminArea ? (adminCtx?.admin || null) : (userCtx?.user || null);
  const onLogout = isAdminArea ? (adminCtx?.adminLogout || null) : (userCtx?.logout || null);

  return (
    <div>
      <style>{`
        :root{--psw:260px}
        @media(max-width:1024px){:root{--psw:240px}}
        @media(max-width:640px){:root{--psw:200px}}
        .panel-main{margin-left:var(--psw);min-height:100vh;background:#f8fafc}
        .panel-inner{max-width:1200px;margin:0 auto;padding:16px}
      `}</style>
      <PanelSidebar items={items} roleLabel={roleLabel} user={sidebarUser} onLogout={onLogout} />
      <main className="panel-main">
        <div className="panel-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default PanelLayout;