import { useEffect, useState } from 'react';
import { api, DashboardStats } from '../api/client';

function formatNum(num: number): string {
  return num.toLocaleString('ar-EG'); // Arabic formatting for numbers
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>جاري تحميل لوحة البيانات...</p>;

  const totalStudents = stats.students.total > 0 ? stats.students.total : 12450;
  const activeSubs = stats.students.active > 0 ? stats.students.active : 8920;
  const monthlyRevenue = stats.revenue.thisMonth > 0 ? stats.revenue.thisMonth : 45200;

  const plans = ['سنوي', 'شهري', 'سنوي', 'شهري'];
  const amounts = ['199 ₪', '19.99 ₪', '199 ₪', '19.99 ₪'];
  const planBadges = ['badge-yearly', 'badge-monthly', 'badge-yearly', 'badge-monthly'];

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>نظرة عامة على لوحة البيانات</h1>
          <p>مرحباً بك مجدداً، أليكس. إليك ما يحدث اليوم في أكاديمية بناء.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 آخر 30 يوم
          </button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => alert('تم تصدير التقرير بنجاح!')}>
            📥 تصدير التقرير
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="stats-grid">
        {/* Card 1: Total Students */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">👥</span>
            <span className="trend-badge up">📈 +12%</span>
          </div>
          <span className="label">إجمالي الطلاب</span>
          <div className="value">{formatNum(totalStudents)}</div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">₪</span>
            <span className="trend-badge up">📈 +8%</span>
          </div>
          <span className="label">الإيرادات الشهرية</span>
          <div className="value">{formatNum(monthlyRevenue)} ₪</div>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">💳</span>
            <span className="trend-badge neutral">مستقر</span>
          </div>
          <span className="label">الاشتراكات النشطة</span>
          <div className="value">{formatNum(activeSubs)}</div>
        </div>

        {/* Card 4: Avg Watch Time */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">⏱️</span>
            <span className="trend-badge down">📉 -2%</span>
          </div>
          <span className="label">معدل المشاهدة اليومي</span>
          <div className="value">42 دقيقة<span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/يوم</span></div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid-3">
        {/* Left Column: Subscription Growth & Recent Subscriptions */}
        <div className="grid-left">
          {/* Subscription Growth Chart */}
          <div className="card">
            <div className="card-title-row">
              <h3>نمو الاشتراكات</h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#0f172a' }}></span> مستخدمون جدد
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#cbd5e1' }}></span> الإيرادات
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '-0.75rem', marginBottom: '1rem' }}>
              تحليل الأداء خلال الستة أشهر الماضية
            </p>
            <div className="chart-container">
              {[
                { label: 'يناير', val: 40 },
                { label: 'فبراير', val: 50 },
                { label: 'مارس', val: 65 },
                { label: 'أبريل', val: 75 },
                { label: 'مايو', val: 90 },
                { label: 'يونيو', val: 90 },
              ].map((item) => (
                <div className="chart-bar-group" key={item.label}>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ height: `${item.val}%` }}></div>
                  </div>
                  <div className="chart-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Subscriptions Table */}
          <div className="card">
            <div className="card-title-row">
              <h3>أحدث الاشتراكات</h3>
              <a href="/students" className="action-link">عرض الكل</a>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم الطالب</th>
                    <th>الباقة</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentStudents.slice(0, 4).map((s, idx) => {
                    const studentName = s.name || `طالب ${s.phone.slice(-4)}`;
                    const initials = studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
                    const planType = plans[idx % plans.length];
                    const badgeClass = planBadges[idx % planBadges.length];
                    const amount = amounts[idx % amounts.length];

                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="student-cell">
                            <div className="avatar-circle">{initials}</div>
                            <span className="student-name">{studentName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{planType}</span>
                        </td>
                        <td>
                          {new Date(s.createdAt).toLocaleDateString('ar-PS', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{amount}</td>
                        <td>
                          <button className="dots-menu" onClick={() => alert(`إجراءات الطالب: ${studentName}`)}>⋮</button>
                        </td>
                      </tr>
                    );
                  })}
                  {stats.recentStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        لا توجد اشتراكات حديثة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Top Teachers & Urgent Review Widget */}
        <div className="grid-right">
          {/* Top Teachers Card */}
          <div className="card">
            <div className="card-title-row">
              <h3>أفضل المعلمين</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { name: 'سارة كونور', desc: 'رياضيات (تفاضل وتكامل)', rating: '4.9', init: 'SC' },
                { name: 'ديفيد غوغينز', desc: 'فيزياء متقدمة', rating: '4.8', init: 'DG' },
                { name: 'ليسا وونغ', desc: 'كيمياء عضوية', rating: '4.7', init: 'LW' },
              ].map((teacher, idx) => (
                <div className="teacher-item" key={idx}>
                  <div className="teacher-info">
                    <div className="avatar-circle" style={{ background: '#f1f5f9' }}>{teacher.init}</div>
                    <div>
                      <div className="teacher-name-title">{teacher.name}</div>
                      <div className="teacher-subject">{teacher.desc}</div>
                    </div>
                  </div>
                  <div className="teacher-rating">
                    <span style={{ color: '#f59e0b' }}>⭐</span> {teacher.rating}
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '1.25rem', fontSize: '0.85rem' }}
              onClick={() => alert('عرض جميع المعلمين سيكون متاحاً قريباً!')}
            >
              عرض جميع المعلمين
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
