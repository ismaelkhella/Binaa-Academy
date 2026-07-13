import { useEffect, useState } from 'react';
import { api, Subject, Teacher } from '../api/client';
import { gradeLabel, branchLabel } from '../utils/labels';

type Level = 'root' | 'grade';

const GRADE_GROUPS = [
  { key: 'GRADE_11__SCIENTIFIC', grade: 'GRADE_11' as const, branch: 'SCIENTIFIC' as const, label: 'الحادي عشر — العلمي',  icon: '🔬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'GRADE_11__LITERARY',  grade: 'GRADE_11' as const, branch: 'LITERARY'  as const, label: 'الحادي عشر — الأدبي',  icon: '📖', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'GRADE_12__SCIENTIFIC', grade: 'GRADE_12' as const, branch: 'SCIENTIFIC' as const, label: 'الثاني عشر — العلمي', icon: '⚗️', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'GRADE_12__LITERARY',  grade: 'GRADE_12' as const, branch: 'LITERARY'  as const, label: 'الثاني عشر — الأدبي', icon: '✍️', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

export default function SubscriptionsPage() {
  const [subjects, setSubjects]   = useState<Subject[]>([]);
  const [teachers, setTeachers]   = useState<Teacher[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Navigation
  const [level, setLevel]       = useState<Level>('root');
  const [gradeKey, setGradeKey] = useState<string | null>(null);

  // Edit modal
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editPrice, setEditPrice]           = useState(0);
  const [editTeacherId, setEditTeacherId]   = useState('');
  const [saving, setSaving]                 = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([api.getSubjects(), api.getTeachers({ limit: '200' })])
      .then(([s, t]) => { setSubjects(s); setTeachers(t.teachers); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { loadData(); }, []);

  async function handleSave() {
    if (!editingSubject) return;
    setSaving(true);
    try {
      await api.updateSubject(editingSubject.id, {
        priceIls: editPrice,
        teacherId: editTeacherId || null,
      });
      setEditingSubject(null);
      loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء التعديل');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(subject: Subject) {
    setEditingSubject(subject);
    setEditPrice(subject.priceIls);
    const t = teachers.find((t) => t.name === subject.teacher?.name);
    setEditTeacherId(t?.id ?? subject.teacher?.id ?? '');
  }

  const activeGroup      = GRADE_GROUPS.find((g) => g.key === gradeKey) ?? null;
  const groupSubjects    = activeGroup
    ? subjects.filter((s) => s.grade === activeGroup.grade && s.branch === activeGroup.branch)
    : [];

  // Breadcrumbs
  const crumbs = [
    { label: 'المواد والاشتراكات', level: 'root' as Level },
    ...(activeGroup ? [{ label: activeGroup.label, level: 'grade' as Level }] : []),
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

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>›</span>}
            <button
              onClick={() => { setLevel(c.level); if (c.level === 'root') setGradeKey(null); }}
              style={{
                background: 'none', border: 'none',
                cursor: i === crumbs.length - 1 ? 'default' : 'pointer',
                fontWeight: i === crumbs.length - 1 ? 700 : 500,
                color: i === crumbs.length - 1 ? '#0f172a' : '#3b82f6',
                fontSize: '0.9rem', padding: '0.2rem 0.3rem', borderRadius: '4px',
                textDecoration: i < crumbs.length - 1 ? 'underline' : 'none',
              }}
            >
              {i === 0 && <span style={{ marginLeft: '4px' }}>🗂️</span>}
              {c.label}
            </button>
          </span>
        ))}
      </nav>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>جاري تحميل البيانات...</p>
      ) : (
        <>
          {/* ── LEVEL 0: Grade-branch folders ─────────────────────────────── */}
          {level === 'root' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {GRADE_GROUPS.map((g) => {
                const count = subjects.filter((s) => s.grade === g.grade && s.branch === g.branch).length;
                const totalPrice = subjects
                  .filter((s) => s.grade === g.grade && s.branch === g.branch)
                  .reduce((sum, s) => sum + s.priceIls, 0);

                return (
                  <button
                    key={g.key}
                    onClick={() => { setGradeKey(g.key); setLevel('grade'); }}
                    style={{
                      background: g.bg, border: `1.5px solid ${g.border}`,
                      borderRadius: '16px', padding: '1.5rem 1.25rem',
                      cursor: 'pointer', textAlign: 'right', transition: 'all 0.18s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex', flexDirection: 'column', gap: '0.75rem',
                    }}
                    onMouseEnter={(e) => { const b = e.currentTarget; b.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; b.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { const b = e.currentTarget; b.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; b.style.transform = 'translateY(0)'; }}
                  >
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{g.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: g.color, marginBottom: '0.3rem' }}>{g.label}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{count} مادة دراسية</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FolderIcon color={g.color} />
                        <span style={{ fontSize: '0.75rem', color: g.color, fontWeight: 600 }}>فتح المجلد</span>
                      </div>
                      {count > 0 && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.06)', borderRadius: '20px', padding: '2px 8px', color: g.color, fontWeight: 700 }}>
                          {totalPrice} ₪
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── LEVEL 1: Subject cards ────────────────────────────────────── */}
          {level === 'grade' && activeGroup && (
            <div>
              {groupSubjects.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem 1rem',
                  border: '2px dashed #e2e8f0', borderRadius: '14px', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
                  <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>لا توجد مواد دراسية بعد</p>
                  <p style={{ fontSize: '0.85rem' }}>أضف المواد من صفحة إدارة المحتوى.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.1rem' }}>
                  {groupSubjects.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        background: '#ffffff', border: `1.5px solid #e2e8f0`,
                        borderRadius: '14px', padding: '1.25rem',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = activeGroup.color; b.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'; b.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = '#e2e8f0'; b.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; b.style.transform = 'translateY(0)'; }}
                    >
                      {/* Card header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '1.6rem' }}>📚</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{sub.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              {gradeLabel(sub.grade)} — {branchLabel(sub.branch)}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          background: sub.priceIls > 0 ? '#dcfce7' : '#f1f5f9',
                          color: sub.priceIls > 0 ? '#15803d' : '#64748b',
                          fontWeight: 700, fontSize: '0.85rem',
                          borderRadius: '20px', padding: '3px 10px', whiteSpace: 'nowrap',
                        }}>
                          {sub.priceIls > 0 ? `${sub.priceIls} ₪` : 'مجاني'}
                        </span>
                      </div>

                      {/* Meta rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <MetaRow icon="👨‍🏫" label="المعلم" value={sub.teacher?.name ?? 'غير معين'} muted={!sub.teacher} />
                        <MetaRow icon="🎬" label="الدروس المرفوعة" value={`${sub._count.videos} درس`} />
                      </div>

                      {/* Edit button */}
                      <button
                        className="btn-secondary"
                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.84rem', borderRadius: '8px', marginTop: 'auto' }}
                        onClick={() => openEdit(sub)}
                      >
                        ✏️ تعديل المادة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Edit Subject Modal ─────────────────────────────────────────── */}
      {editingSubject && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '450px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✏️</span> تعديل بيانات مادة: {editingSubject.name}
            </h3>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>سعر الاشتراك (₪)</label>
              <input
                type="number"
                min="0"
                value={editPrice}
                onChange={(e) => setEditPrice(Math.max(0, +e.target.value))}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>المعلم المسؤول</label>
              <select
                value={editTeacherId}
                onChange={(e) => setEditTeacherId(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', background: '#fff' }}
              >
                <option value="">— غير معين —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
              <button className="btn-secondary" onClick={() => setEditingSubject(null)} style={{ flex: 1 }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MetaRow({ icon, label, value, muted }: { icon: string; label: string; value: string; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
      <span>{icon}</span>
      <span>{label}:</span>
      <strong style={{ color: muted ? '#94a3b8' : '#334155' }}>{value}</strong>
    </div>
  );
}

function FolderIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  );
}
