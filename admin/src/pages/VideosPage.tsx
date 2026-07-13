import { useEffect, useState, FormEvent } from 'react';
import { api, Video, Subject } from '../api/client';
import { formatDuration } from '../utils/labels';

type Level = 'root' | 'grade' | 'subject';

interface Crumb {
  label: string;
  level: Level;
  gradeKey?: string;
  subjectId?: string;
}

const GRADE_GROUPS = [
  { key: 'GRADE_11__SCIENTIFIC', grade: 'GRADE_11' as const, branch: 'SCIENTIFIC' as const, label: 'الحادي عشر — العلمي', icon: '🔬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'GRADE_11__LITERARY',  grade: 'GRADE_11' as const, branch: 'LITERARY'  as const, label: 'الحادي عشر — الأدبي', icon: '📖', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'GRADE_12__SCIENTIFIC', grade: 'GRADE_12' as const, branch: 'SCIENTIFIC' as const, label: 'الثاني عشر — العلمي', icon: '⚗️', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'GRADE_12__LITERARY',  grade: 'GRADE_12' as const, branch: 'LITERARY'  as const, label: 'الثاني عشر — الأدبي', icon: '✍️', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

const EMPTY_FORM = {
  title: '', description: '', streamUrl: '', pdfUrl: '',
  questions: [
    { text: '', options: ['', '', '', ''], answer: '' },
    { text: '', options: ['', '', '', ''], answer: '' },
    { text: '', options: ['', '', '', ''], answer: '' },
  ],
};

const EMPTY_SUBJECT_FORM = { name: '', teacherId: '', priceIls: '' };

export default function VideosPage() {
  const [videos, setVideos]     = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);

  // Navigation state
  const [level, setLevel]       = useState<Level>('root');
  const [gradeKey, setGradeKey] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);

  // Add-subject modal
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm]           = useState(EMPTY_SUBJECT_FORM);
  const [savingSubject, setSavingSubject]       = useState(false);

  // Add-video modal
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [uploadingVideo, setUploadingVideo]           = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.getVideos(), api.getSubjects()])
      .then(([v, s]) => { setVideos(v); setSubjects(s); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeGroup   = GRADE_GROUPS.find((g) => g.key === gradeKey) ?? null;
  const groupSubjects = activeGroup
    ? subjects.filter((s) => s.grade === activeGroup.grade && s.branch === activeGroup.branch)
    : [];
  const activeSubject = subjects.find((s) => s.id === subjectId) ?? null;
  const subjectVideos = subjectId ? videos.filter((v) => v.subjectId === subjectId) : [];

  // ── Breadcrumbs ───────────────────────────────────────────────────────────
  const crumbs: Crumb[] = [{ label: 'المحتوى والدروس', level: 'root' }];
  if (gradeKey && activeGroup) crumbs.push({ label: activeGroup.label, level: 'grade', gradeKey });
  if (subjectId && activeSubject) crumbs.push({ label: activeSubject.name, level: 'subject', gradeKey: gradeKey ?? undefined, subjectId });

  function navigateTo(crumb: Crumb) {
    setLevel(crumb.level);
    setGradeKey(crumb.gradeKey ?? null);
    setSubjectId(crumb.subjectId ?? null);
  }

  // ── Upload helpers ────────────────────────────────────────────────────────
  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingVideo(true);
    try { const r = await api.uploadFile(file); setForm((p) => ({ ...p, streamUrl: r.url })); }
    catch { alert('فشل رفع ملف الفيديو'); }
    finally { setUploadingVideo(false); }
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingAttachment(true);
    try { const r = await api.uploadFile(file); setForm((p) => ({ ...p, pdfUrl: r.url })); }
    catch { alert('فشل رفع الملف المرفق'); }
    finally { setUploadingAttachment(false); }
  }

  async function handleCreateSubject(e: FormEvent) {
    e.preventDefault();
    if (!activeGroup) return;
    setSavingSubject(true);
    try {
      await api.createSubject({
        name: subjectForm.name,
        grade: activeGroup.grade,
        branch: activeGroup.branch,
        priceIls: subjectForm.priceIls ? Number(subjectForm.priceIls) : 0,
        teacherId: subjectForm.teacherId || undefined,
      });
      setShowSubjectModal(false);
      setSubjectForm(EMPTY_SUBJECT_FORM);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء المادة');
    } finally {
      setSavingSubject(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!subjectId) return;
    try {
      const filteredQ = form.questions
        .filter((q) => q.text.trim() && q.options.some((o) => o.trim()) && q.answer)
        .map((q) => ({ text: q.text, options: q.options.filter((o) => o.trim()), answer: q.answer }));
      await api.createVideo({
        subjectId,
        title: form.title,
        description: form.description,
        streamUrl: form.streamUrl,
        status: 'PUBLISHED',
        pdfUrl: form.pdfUrl || undefined,
        questions: filteredQ.length > 0 ? filteredQ : undefined,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الفيديو');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    try { await api.deleteVideo(id); load(); }
    catch (err) { alert(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف'); }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>إدارة المحتوى والدروس</h1>
          <p>تصفح المحتوى التعليمي على شكل مجلدات وأضف الدروس لكل مادة دراسية.</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {i > 0 && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>›</span>}
            <button
              onClick={() => navigateTo(c)}
              style={{
                background: 'none', border: 'none', cursor: i === crumbs.length - 1 ? 'default' : 'pointer',
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
        <p style={{ color: 'var(--text-muted)' }}>جاري تحميل المحتوى...</p>
      ) : (
        <>
          {/* ── LEVEL 0: Grade-branch folders ─────────────────────────────── */}
          {level === 'root' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              {GRADE_GROUPS.map((g) => {
                const count = subjects.filter((s) => s.grade === g.grade && s.branch === g.branch).length;
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
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                  >
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{g.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: g.color, marginBottom: '0.3rem' }}>{g.label}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{count} مادة دراسية</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.25rem' }}>
                      <FolderIcon color={g.color} />
                      <span style={{ fontSize: '0.75rem', color: g.color, fontWeight: 600 }}>فتح المجلد</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── LEVEL 1: Subject folders ──────────────────────────────────── */}
          {level === 'grade' && activeGroup && (
            <div>
              {/* Action bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                <button
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: '9px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => { setSubjectForm(EMPTY_SUBJECT_FORM); setShowSubjectModal(true); }}
                >
                  <span style={{ fontSize: '1rem' }}>📁</span> إضافة مادة جديدة
                </button>
              </div>

              {groupSubjects.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem 1rem',
                  border: '2px dashed #e2e8f0', borderRadius: '14px', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
                  <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>لا توجد مواد دراسية بعد</p>
                  <p style={{ fontSize: '0.85rem' }}>اضغط "إضافة مادة جديدة" لإنشاء أول مادة في هذا الفرع.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {groupSubjects.map((sub) => {
                    const vCount = videos.filter((v) => v.subjectId === sub.id).length;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => { setSubjectId(sub.id); setLevel('subject'); }}
                        style={{
                          background: '#ffffff', border: '1.5px solid #e2e8f0',
                          borderRadius: '14px', padding: '1.25rem 1rem',
                          cursor: 'pointer', textAlign: 'right', transition: 'all 0.18s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          display: 'flex', flexDirection: 'column', gap: '0.6rem',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = activeGroup.color; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px rgba(0,0,0,0.08)`; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                      >
                        <span style={{ fontSize: '2rem', lineHeight: 1 }}>📚</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.25rem' }}>{sub.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {sub.teacher?.name ?? 'بدون معلم'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', borderRadius: '20px', padding: '2px 10px', color: '#475569', fontWeight: 600 }}>
                            {vCount} درس
                          </span>
                          <FolderIcon color={activeGroup.color} size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── LEVEL 2: Lessons inside subject ──────────────────────────── */}
          {level === 'subject' && activeSubject && (
            <div>
              {/* Subject info bar */}
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '12px', padding: '1rem 1.25rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📚</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{activeSubject.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>المعلم: {activeSubject.teacher?.name ?? 'غير معين'}</div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', borderRadius: '9px' }}
                  onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
                >
                  + إضافة درس
                </button>
              </div>

              {/* Lessons grid */}
              {subjectVideos.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '3rem 1rem',
                  border: '2px dashed #e2e8f0', borderRadius: '14px', color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎬</div>
                  <p style={{ fontWeight: 600, marginBottom: '0.4rem' }}>لا توجد دروس بعد</p>
                  <p style={{ fontSize: '0.85rem' }}>اضغط "+ إضافة درس" لرفع أول فيديو لهذه المادة.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {subjectVideos.map((v, idx) => (
                    <div key={v.id} style={{
                      background: '#ffffff', border: '1px solid #e2e8f0',
                      borderRadius: '12px', padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      transition: 'box-shadow 0.15s',
                    }}>
                      {/* Lesson number */}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.85rem', color: '#475569', flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>

                      {/* Title & meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          🎬 {v.title}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
                          <span>⏱ {formatDuration(v.durationSec)}</span>
                          <span>👁 {v._count.videoViews} مشاهدة</span>
                          {v.pdfUrl && (
                            <a href={v.pdfUrl} target="_blank" rel="noreferrer"
                              style={{ color: 'var(--accent)', textDecoration: 'underline', fontWeight: 600 }}
                              onClick={(e) => e.stopPropagation()}>
                              📎 مرفق
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`badge ${v.status === 'PUBLISHED' ? 'badge-success' : 'badge-muted'}`} style={{ flexShrink: 0 }}>
                        {v.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                      </span>

                      {/* Delete */}
                      <button
                        className="btn-danger"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', borderRadius: '7px', flexShrink: 0 }}
                        onClick={() => handleDelete(v.id)}
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Add Subject Modal ───────────────────────────────────────────── */}
      {showSubjectModal && activeGroup && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '460px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <span style={{ marginLeft: '6px' }}>{activeGroup.icon}</span>
              إضافة مادة جديدة — {activeGroup.label}
            </h3>

            <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>اسم المادة</label>
                <input
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  required
                  placeholder="مثال: الرياضيات، الفيزياء، اللغة العربية..."
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>المعلم المسؤول</label>
                <select
                  value={subjectForm.teacherId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.9rem', background: '#fff' }}
                >
                  <option value="">— بدون معلم (يمكن تعيينه لاحقاً) —</option>
                  {(() => {
                    // Collect unique teachers from existing subjects
                    const seen = new Set<string>();
                    return subjects
                      .filter((s) => s.teacher && !seen.has(s.teacher.id) && seen.add(s.teacher.id))
                      .map((s) => (
                        <option key={s.teacher!.id} value={s.teacher!.id}>{s.teacher!.name}</option>
                      ));
                  })()}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  يمكن تغيير المعلم لاحقاً من صفحة إعدادات المواد.
                </p>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>سعر الاشتراك (شيكل)</label>
                <input
                  type="number"
                  min="0"
                  value={subjectForm.priceIls}
                  onChange={(e) => setSubjectForm({ ...subjectForm, priceIls: e.target.value })}
                  placeholder="مثال: 150"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={savingSubject}>
                  {savingSubject ? 'جاري الحفظ...' : 'إنشاء المادة'}
                </button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowSubjectModal(false); setSubjectForm(EMPTY_SUBJECT_FORM); }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Video Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '550px', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '1.25rem',
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              📁 إضافة درس جديد — {activeSubject?.name}
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>عنوان الدرس</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="مثال: الدرس الأول — مقدمة في المادة" />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="شرح مبسط لمحتوى الدرس..." />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>رفع ملف الفيديو</label>
                <input type="file" accept="video/*" onChange={handleVideoUpload} style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }} />
                {uploadingVideo && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block' }}>جاري رفع الفيديو...</span>}
                <label style={{ display: 'block', margin: '0.5rem 0 0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>أو رابط البث (HLS)</label>
                <input value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} placeholder="https://..." />
                {form.streamUrl?.startsWith('/uploads') && (
                  <span style={{ fontSize: '0.75rem', color: '#047857' }}>✅ تم رفع الفيديو: {form.streamUrl.split('/').pop()}</span>
                )}
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>الملف المرفق (PDF, ZIP…)</label>
                <input type="file" onChange={handleAttachmentUpload} style={{ fontSize: '0.85rem' }} />
                {uploadingAttachment && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block' }}>جاري الرفع...</span>}
                {form.pdfUrl && (
                  <a href={form.pdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: '#047857', display: 'block', marginTop: '0.25rem' }}>
                    ✅ {form.pdfUrl.split('/').pop()}
                  </a>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>🧠 أسئلة الاختبار (اختياري)</h4>
                {form.questions.map((q, qIdx) => (
                  <div key={qIdx} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#475569', marginBottom: '0.4rem' }}>السؤال {qIdx + 1}</div>
                    <input
                      value={q.text}
                      onChange={(e) => { const qs = [...form.questions]; qs[qIdx].text = e.target.value; setForm({ ...form, questions: qs }); }}
                      placeholder="نص السؤال..."
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      {q.options.map((opt, oIdx) => (
                        <input key={oIdx} value={opt}
                          onChange={(e) => { const qs = [...form.questions]; qs[qIdx].options[oIdx] = e.target.value; setForm({ ...form, questions: qs }); }}
                          placeholder={`الخيار ${oIdx + 1}`}
                          style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      ))}
                    </div>
                    <select value={q.answer}
                      onChange={(e) => { const qs = [...form.questions]; qs[qIdx].answer = e.target.value; setForm({ ...form, questions: qs }); }}
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      <option value="">-- الإجابة الصحيحة --</option>
                      {q.options.map((o, i) => o ? <option key={i} value={o}>{o}</option> : null)}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ الدرس</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowModal(false); setForm(EMPTY_FORM); }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Small reusable folder icon
function FolderIcon({ color, size = 20 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  );
}
