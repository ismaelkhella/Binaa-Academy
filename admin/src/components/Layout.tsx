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

  function logout() {
    localStorage.removeItem('admin_token');
    navigate('/login');
  }

  return (
    <div className="layout">
      {/* Right Sidebar (RTL layout) */}
      <aside className="sidebar">
        <div className="sidebar-logo-container">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <span className="logo-title">أكاديمية بناء</span>
            <span className="logo-subtitle">BINA ACADEMY</span>
          </div>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => {
            const isImplemented = ['/', '/students', '/videos', '/subscriptions', '/teachers', '/settings', '/notifications'].includes(item.to);
            return (
              <NavLink
                key={item.to}
                to={isImplemented ? item.to : '#'}
                end={item.to === '/'}
                onClick={(e) => {
                  if (!isImplemented) {
                    e.preventDefault();
                    alert('هذا القسم سيكون متاحاً قريباً!');
                  }
                }}
                className={({ isActive }) => `nav-link${isActive && isImplemented ? ' active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar bottom card with Admin Profile and Logout */}
        <div className="sidebar-footer">
          <div className="admin-profile-card">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
              alt="أحمد المنصور"
              className="admin-avatar"
            />
            <div className="admin-info">
              <span className="admin-name">أحمد المنصور</span>
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
          <div className="header-search">
            <input type="text" placeholder="البحث عن معلم، مادة، أو مستوى دراسي..." />
          </div>
          <div className="header-actions">
            <button className="notif-btn" onClick={() => alert('لا توجد تنبيهات جديدة')}>
              🔔
              <span className="notif-badge"></span>
            </button>
            <div className="user-profile">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80"
                alt="أحمد المنصور"
                className="avatar"
              />
              <div className="info">
                <span className="name">أحمد المنصور</span>
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
        <footer style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          background: '#ffffff'
        }}>
          <div>© 2026 أكاديمية بناء. جميع الحقوق الإدارية محفوظة.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="#" onClick={(e) => e.preventDefault()}>حالة النظام</a>
            <a href="#" onClick={(e) => e.preventDefault()}>مركز المساعدة</a>
            <a href="#" onClick={(e) => e.preventDefault()}>سياسة الخصوصية</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
