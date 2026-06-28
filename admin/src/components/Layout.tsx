import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'لوحة البيانات', icon: '📊' },
  { to: '/students', label: 'الطلاب', icon: '👨‍🎓' },
  { to: '/videos', label: 'المحتوى', icon: '🎥' },
  { to: '/subscriptions', label: 'الاشتراكات', icon: '💳' },
];

export default function Layout() {
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem('admin_token');
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          أكاديمية بناء
          <span>لوحة التحكم</span>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: '1rem' }}>
          <button className="btn-secondary" style={{ width: '100%' }} onClick={logout}>
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
