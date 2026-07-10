import { useEffect, useState } from 'react';
import { api, Subject, Teacher } from '../api/client';
import { gradeLabel, branchLabel } from '../utils/labels';

export default function SubscriptionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Editing state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editTeacherId, setEditTeacherId] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getSubjects(),
      api.getTeachers({ limit: '200' })
    ])
      .then(([subjectsData, teachersData]) => {
        setSubjects(subjectsData);
        setTeachers(teachersData.teachers);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleSave() {
    if (!editingSubject) return;
    try {
      await api.updateSubject(editingSubject.id, {
        priceIls: editPrice,
        teacherId: editTeacherId || null,
      });
      setEditingSubject(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء تعديل المادة');
    }
  }

  // Filter subjects by grade and branch
  const getSubjectsByGroup = (grade: 'GRADE_11' | 'GRADE_12', branch: 'SCIENTIFIC' | 'LITERARY') => {
    return subjects.filter((s) => s.grade === grade && s.branch === branch);
  };

  const groups = [
    { grade: 'GRADE_11' as const, branch: 'SCIENTIFIC' as const, title: 'الصف الحادي عشر — علمي' },
    { grade: 'GRADE_11' as const, branch: 'LITERARY' as const, title: 'الصف الحادي عشر — أدبي' },
    { grade: 'GRADE_12' as const, branch: 'SCIENTIFIC' as const, title: 'الصف الثاني عشر — علمي' },
    { grade: 'GRADE_12' as const, branch: 'LITERARY' as const, title: 'الصف الثاني عشر — أدبي' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>إدارة المواد والاشتراكات</h1>
          <p>عرض وتعديل أسعار اشتراك المواد وتعيين المعلمين لكل مادة دراسية.</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>جاري تحميل البيانات...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groups.map((group) => {
            const groupSubjects = getSubjectsByGroup(group.grade, group.branch);
            return (
              <div key={group.title} className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.25rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📚</span>
                  {group.title}
                  <span style={{ fontSize: '0.8rem', fontWeight: 550, color: 'var(--text-muted)', marginRight: 'auto' }}>
                    {groupSubjects.length} مواد
                  </span>
                </h2>

                {groupSubjects.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>لا توجد مواد مضافة في هذا القسم.</p>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.25rem'
                  }}>
                    {groupSubjects.map((subject) => (
                      <div key={subject.id} style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        background: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{subject.name}</h3>
                            <span className="badge badge-success" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                              {subject.priceIls} ₪
                            </span>
                          </div>
                          
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>👨‍🏫 المعلم:</span>
                            <strong style={{ color: '#334155' }}>
                              {subject.teacher?.name ?? 'غير معين'}
                            </strong>
                          </p>

                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🎥 الدروس المرفوعة:</span>
                            <strong style={{ color: '#334155' }}>
                              {subject._count.videos} دروس
                            </strong>
                          </p>
                        </div>

                        <button
                          className="btn-secondary"
                          style={{ padding: '0.5rem', fontSize: '0.85rem', width: '100%', borderRadius: '8px' }}
                          onClick={() => {
                            setEditingSubject(subject);
                            setEditPrice(subject.priceIls);
                            const activeTeacher = teachers.find(t => t.name === subject.teacher?.name);
                            setEditTeacherId(activeTeacher?.id || '');
                          }}
                        >
                          تعديل المادة
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '450px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              تعديل بيانات مادة: {editingSubject.name} ({gradeLabel(editingSubject.grade)} - {branchLabel(editingSubject.branch)})
            </h3>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>سعر الاشتراك (₪)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(Math.max(0, +e.target.value))}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>المعلم المسؤول</label>
              <select value={editTeacherId} onChange={(e) => setEditTeacherId(e.target.value)}>
                <option value="">-- غير معين --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn-primary"
                onClick={handleSave}
                style={{ flex: 1 }}
              >
                حفظ التعديلات
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditingSubject(null)}
                style={{ flex: 1 }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
