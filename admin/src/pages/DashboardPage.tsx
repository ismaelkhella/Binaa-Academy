import { useEffect, useState } from 'react';
import { api, DashboardStats } from '../api/client';
import { gradeLabel, formatDate } from '../utils/labels';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-msg">{error}</div>;
  if (!stats) return <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>;

  return (
    <>
      <div className="page-header">
        <h1>لوحة البيانات</h1>
        <p>نظرة عامة على أداء أكاديمية بناء</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">إجمالي الطلاب</div>
          <div className="value">{stats.students.total}</div>
        </div>
        <div className="stat-card">
          <div className="label">طلاب نشطون</div>
          <div className="value">{stats.students.active}</div>
        </div>
        <div className="stat-card">
          <div className="label">تجربة مجانية</div>
          <div className="value">{stats.students.trial}</div>
        </div>
        <div className="stat-card">
          <div className="label">اشتراكات هذا الشهر</div>
          <div className="value">{stats.subscriptions.thisMonth}</div>
        </div>
        <div className="stat-card">
          <div className="label">إيرادات الشهر (₪)</div>
          <div className="value">{stats.revenue.thisMonth}</div>
        </div>
        <div className="stat-card">
          <div className="label">الفيديوهات المنشورة</div>
          <div className="value">{stats.content.totalVideos}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>أحدث المشتركين</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الهاتف</th>
                  <th>الاسم</th>
                  <th>الصف</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentStudents.map((s) => (
                  <tr key={s.id}>
                    <td dir="ltr">{s.phone}</td>
                    <td>{s.name ?? '—'}</td>
                    <td>{gradeLabel(s.grade)}</td>
                    <td>{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
                {stats.recentStudents.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>أكثر الفيديوهات مشاهدة</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>المادة</th>
                  <th>المشاهدات</th>
                </tr>
              </thead>
              <tbody>
                {stats.topVideos.map((v) => (
                  <tr key={v.videoId}>
                    <td>{v.title}</td>
                    <td>{v.subject}</td>
                    <td>{v.views}</td>
                  </tr>
                ))}
                {stats.topVideos.length === 0 && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد مشاهدات بعد</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
