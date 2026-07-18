import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, DashboardStats } from '../api/client';
import { gradeLabel, formatDate } from '../utils/labels';

function formatNum(num: number): string {
  return num.toLocaleString('ar-EG'); // Arabic formatting for numbers
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const adminName = localStorage.getItem('admin_name');

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return <p style={{ color: 'var(--text-muted)', padding: '1rem' }}>جاري تحميل لوحة البيانات...</p>;

  // Real month-over-month trend for paid subscriptions (no fake percentages)
  const { thisMonth, lastMonth } = stats.subscriptions;
  const subsTrend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>نظرة عامة على لوحة البيانات</h1>
          <p>{adminName ? `مرحباً بك مجدداً، ${adminName}.` : 'مرحباً بك مجدداً.'} إليك ما يحدث اليوم في أكاديمية بناء.</p>
        </div>
      </div>

      {/* KPI Cards Grid — all values come from the live database */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">👥</span>
            {stats.students.trial > 0 && (
              <span className="trend-badge neutral">{formatNum(stats.students.trial)} تجريبي</span>
            )}
          </div>
          <span className="label">إجمالي الطلاب</span>
          <div className="value">{formatNum(stats.students.total)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">💳</span>
            {subsTrend !== null && (
              <span className={`trend-badge ${subsTrend >= 0 ? 'up' : 'down'}`}>
                {subsTrend >= 0 ? '📈 +' : '📉 '}{subsTrend}% عن الشهر الماضي
              </span>
            )}
          </div>
          <span className="label">الاشتراكات النشطة</span>
          <div className="value">{formatNum(stats.students.active)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">₪</span>
            <span className="trend-badge neutral">{formatNum(thisMonth)} اشتراك هذا الشهر</span>
          </div>
          <span className="label">إيرادات هذا الشهر</span>
          <div className="value">{formatNum(stats.revenue.thisMonth)} ₪</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon">📚</span>
            <span className="trend-badge neutral">{stats.content.completionRate}% نسبة الإكمال</span>
          </div>
          <span className="label">الدروس المنشورة</span>
          <div className="value">{formatNum(stats.content.totalVideos)}</div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid-3">
        {/* Left Column: Recent Students */}
        <div className="grid-left">
          <div className="card">
            <div className="card-title-row">
              <h3>أحدث الطلاب المسجلين</h3>
              <Link to="/students" className="action-link">عرض الكل</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>اسم الطالب</th>
                    <th>الصف</th>
                    <th>تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentStudents.slice(0, 6).map((s) => {
                    const studentName = s.name || `طالب ${s.phone.slice(-4)}`;
                    const initials = studentName.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'ط';
                    return (
                      <tr key={s.id}>
                        <td>
                          <div className="student-cell">
                            <div className="avatar-circle">{initials}</div>
                            <span className="student-name">{studentName}</span>
                          </div>
                        </td>
                        <td>{gradeLabel(s.grade)}</td>
                        <td>{formatDate(s.createdAt)}</td>
                      </tr>
                    );
                  })}
                  {stats.recentStudents.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        لا يوجد طلاب مسجلون بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Most-Watched Lessons */}
        <div className="grid-right">
          <div className="card">
            <div className="card-title-row">
              <h3>الدروس الأكثر مشاهدة</h3>
              <Link to="/videos" className="action-link">كل الدروس</Link>
            </div>
            {stats.topVideos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
                لا توجد مشاهدات مسجلة بعد.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {stats.topVideos.map((v) => (
                  <div className="teacher-item" key={v.videoId}>
                    <div className="teacher-info">
                      <div className="avatar-circle" style={{ background: '#f1f5f9' }}>🎬</div>
                      <div>
                        <div className="teacher-name-title">{v.title}</div>
                        <div className="teacher-subject">{v.subject}</div>
                      </div>
                    </div>
                    <div className="teacher-rating">{formatNum(v.views)} مشاهدة</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
