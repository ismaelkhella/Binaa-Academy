import { useEffect, useState } from 'react';
import { api, Student } from '../api/client';
import { gradeLabel, branchLabel, planLabel, formatDate } from '../utils/labels';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [branch, setBranch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (grade) params.grade = grade;
    if (branch) params.branch = branch;
    api.getStudents(params)
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleGrant(id: string) {
    if (!confirm('منح اشتراك شهري مجاني لهذا الطالب؟')) return;
    await api.grantSubscription(id, 'MONTHLY', 30);
    load();
  }

  async function handleFreeze(id: string, freeze: boolean) {
    await api.freezeSubscription(id, freeze, freeze ? 'تجميد يدوي' : undefined);
    load();
  }

  return (
    <>
      <div className="page-header">
        <h1>إدارة الطلاب</h1>
        <p>عرض وإدارة حسابات الطلاب والاشتراكات</p>
      </div>

      <div className="filters">
        <input
          placeholder="بحث بالاسم أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">كل الصفوف</option>
          <option value="GRADE_11">الحادي عشر</option>
          <option value="GRADE_12">الثاني عشر</option>
        </select>
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">كل الفروع</option>
          <option value="SCIENTIFIC">علمي</option>
          <option value="LITERARY">أدبي</option>
        </select>
        <button className="btn-primary" onClick={load}>بحث</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الهاتف</th>
                  <th>الاسم</th>
                  <th>الصف</th>
                  <th>الفرع</th>
                  <th>الاشتراك</th>
                  <th>المشاهدات</th>
                  <th>التسجيل</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td dir="ltr">{s.phone}</td>
                    <td>{s.name ?? '—'}</td>
                    <td>{gradeLabel(s.grade)}</td>
                    <td>{branchLabel(s.branch)}</td>
                    <td>
                      {s.subscription ? (
                        <span className={`badge ${s.subscription.isFrozen ? 'badge-warning' : 'badge-success'}`}>
                          {planLabel(s.subscription.planType)}
                          {s.subscription.isFrozen && ' (مجمد)'}
                        </span>
                      ) : (
                        <span className="badge badge-muted">بدون</span>
                      )}
                    </td>
                    <td>{s.viewsCount}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleGrant(s.id)}>
                        منح اشتراك
                      </button>
                      {s.subscription && !s.subscription.isFrozen && (
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleFreeze(s.id, true)}>
                          تجميد
                        </button>
                      )}
                      {s.subscription?.isFrozen && (
                        <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleFreeze(s.id, false)}>
                          إلغاء التجميد
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا يوجد طلاب</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
