import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import AnimatedBackground from '../common/AnimatedBackground';

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: '⬛', emoji: '📊' },
  { label: 'Employees', path: '/employees', icon: '👥', emoji: '👥' },
  { label: 'Departments', path: '/departments', icon: '🏢', emoji: '🏢' },
  { label: 'Reports', path: '/reports', icon: '📈', emoji: '📈' },
  { label: 'Activity Logs', path: '/activities', icon: '📋', emoji: '📋', adminOnly: true },
  { label: 'Trash', path: '/trash', icon: '🗑', emoji: '🗑', adminOnly: true },
];

const BOTTOM_NAV = [
  { label: 'Profile', path: '/profile', emoji: '👤' },
  { label: 'Settings', path: '/settings', emoji: '⚙️' },
];

function NavIcon({ emoji, label, collapsed }) {
  return (
    <span style={{ fontSize: 17, flexShrink: 0, width: 20, textAlign: 'center' }} title={collapsed ? label : undefined}>
      {emoji}
    </span>
  );
}

function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Layout() {
  const { user, logout, sessionWarning, setSessionWarning } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();
  const location = useLocation();
  const profileRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const pageLabel = () => {
    const all = [...NAV, ...BOTTOM_NAV];
    const match = all.find(n => location.pathname.startsWith(n.path));
    return match?.label || 'Dashboard';
  };

  const visibleNav = NAV.filter(n => !n.adminOnly || user?.role === 'admin');

  return (
    <div className="app-layout">
      <AnimatedBackground particles={15} />

      {/* Sidebar */}
      <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">E</div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="logo-text">EmpAxis</div>
              <div className="logo-sub">PRO v2.0</div>
            </motion.div>
          )}
        </div>

        <div className="sidebar-nav">
          {!collapsed && <div className="nav-section-label">Main Menu</div>}
          {visibleNav.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <NavIcon emoji={item.emoji} label={item.label} collapsed={collapsed} />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}

          {!collapsed && <div className="nav-section-label" style={{ marginTop: 12 }}>Account</div>}
          {BOTTOM_NAV.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <NavIcon emoji={item.emoji} label={item.label} collapsed={collapsed} />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar-sm">{getInitials(user?.name)}</div>
            {!collapsed && (
              <motion.div className="user-info-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="user-name-sm">{user?.name}</div>
                <div className="user-role-sm">{user?.role}</div>
              </motion.div>
            )}
          </div>
          {!collapsed && (
            <button className="btn btn-danger btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={handleLogout}>
              🚪 Logout
            </button>
          )}
        </div>

        <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '›' : '‹'}
        </button>
      </nav>

      {/* Main Content */}
      <div className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        {/* Top Header */}
        <header className="top-header">
          <div className="breadcrumb">
            <span>EmpAxis</span>
            <span>›</span>
            <span className="current">{pageLabel()}</span>
          </div>
          <div className="header-actions">
            <button className="header-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="profile-dropdown" ref={profileRef}>
              <div className="profile-trigger" onClick={() => setProfileOpen(o => !o)}>
                <div className="avatar" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#ec4899)', display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff' }}>
                  {getInitials(user?.name)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
                <span style={{ fontSize: 11 }}>▾</span>
              </div>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div className="profile-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="profile-menu-item" onClick={() => { navigate('/profile'); setProfileOpen(false); }}>👤 My Profile</div>
                    <div className="profile-menu-item" onClick={() => { navigate('/settings'); setProfileOpen(false); }}>⚙️ Settings</div>
                    <div style={{ borderTop: '1px solid rgba(99,102,241,0.1)', margin: '4px 0' }} />
                    <div className="profile-menu-item danger" onClick={handleLogout}>🚪 Logout</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="page-wrapper">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.4,0,0.2,1] }}>
            <Outlet />
          </motion.div>
        </div>
      </div>

      {/* Session Warning Modal */}
      <AnimatePresence>
        {sessionWarning && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="modal-header">
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏰</div>
                <div className="modal-title">Session Expiring Soon</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 8 }}>
                  Your session will expire in 2 minutes due to inactivity. Click below to stay signed in.
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-danger" onClick={handleLogout}>Sign Out</button>
                <button className="btn btn-primary" onClick={() => setSessionWarning(false)}>Stay Signed In</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

