import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: '📊' },
  { to: '/students', label: 'إدارة الطلاب', icon: '👥' },
  { to: '/videos', label: 'المحتوى والدروس', icon: '📁' },
  { to: '/teachers', label: 'إدارة المعلمين', icon: '👤' },
  { to: '/subscriptions', label: 'الاشتراكات والمدفوعات', icon: '💳' },
  { to: '/notifications', label: 'التنبيهات', icon: '🔔' },
  { to: '/settings', label: 'الإعدادات', icon: '⚙️' },
];

export default function Layout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const adminName = localStorage.getItem('admin_name') || 'المدير';
  const adminInitials = adminName.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'م';

  function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_name');
    navigate('/login');
  }

  return (
    <div className="layout">
      {/* Mobile drawer backdrop */}
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}

      {/* Right Sidebar (RTL layout) — becomes a slide-in drawer on mobile */}
      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-logo-container">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <span className="logo-title">أكاديمية بناء</span>
            <span className="logo-subtitle">BINA ACADEMY</span>
          </div>
          <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة">✕</button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar bottom card with Admin Profile and Logout */}
        <div className="sidebar-footer">
          <div className="admin-profile-card">
            <div
              className="admin-avatar"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}
            >
              {adminInitials}
            </div>
            <div className="admin-info">
              <span className="admin-name">{adminName}</span>
              <span className="admin-role">مدير النظام</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <span className="logout-icon">📤</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main">
        {/* Top Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة">☰</button>
            <div className="header-title" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              لوحة تحكم أكاديمية بناء
            </div>
          </div>
          <div className="header-actions">
            <button className="notif-btn" onClick={() => navigate('/notifications')} title="التنبيهات">
              🔔
            </button>
            <div className="user-profile">
              <div
                className="avatar"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}
              >
                {adminInitials}
              </div>
              <div className="info">
                <span className="name">{adminName}</span>
                <span className="role">مدير النظام</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="content-area">
          <Outlet />
        </main>

        {/* administrative footer */}
        <footer className="app-footer">
          <div>© 2026 أكاديمية بناء. جميع الحقوق محفوظة.</div>
          <div>لوحة التحكم الإدارية</div>
        </footer>
      </div>
    </div>
  );
}
