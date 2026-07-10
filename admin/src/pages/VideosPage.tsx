import { useEffect, useState, FormEvent } from 'react';
import { api, Video, Subject } from '../api/client';
import { formatDuration } from '../utils/labels';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Expanded state for subjects
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Add Video modal state
  const [uploadSubjectId, setUploadSubjectId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    streamUrl: '',
    pdfUrl: '',
    questions: [
      { text: '', options: ['', '', '', ''], answer: '' },
      { text: '', options: ['', '', '', ''], answer: '' },
      { text: '', options: ['', '', '', ''], answer: '' },
    ]
  });
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const res = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, streamUrl: res.url }));
    } catch (err) {
      alert('فشل رفع ملف الفيديو');
    } finally {
      setUploadingVideo(false);
    }
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAttachment(true);
    try {
      const res = await api.uploadFile(file);
      setForm((prev) => ({ ...prev, pdfUrl: res.url }));
    } catch (err) {
      alert('فشل رفع الملف المرفق');
    } finally {
      setUploadingAttachment(false);
    }
  }

  function load() {
    setLoading(true);
    Promise.all([api.getVideos(), api.getSubjects()])
      .then(([v, s]) => {
        setVideos(v);
        setSubjects(s);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const toggleSubject = (id: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!uploadSubjectId) return;
    try {
      const filteredQuestions = form.questions
        .filter((q) => q.text.trim() !== '' && q.options.some((opt) => opt.trim() !== '') && q.answer !== '')
        .map((q) => ({
          text: q.text,
          options: q.options.filter(opt => opt.trim() !== ''),
          answer: q.answer
        }));

      await api.createVideo({
        subjectId: uploadSubjectId,
        title: form.title,
        description: form.description,
        streamUrl: form.streamUrl,
        status: 'PUBLISHED',
        pdfUrl: form.pdfUrl || undefined,
        questions: filteredQuestions.length > 0 ? filteredQuestions : undefined
      });
      setUploadSubjectId(null);
      setForm({
        title: '',
        description: '',
        streamUrl: '',
        pdfUrl: '',
        questions: [
          { text: '', options: ['', '', '', ''], answer: '' },
          { text: '', options: ['', '', '', ''], answer: '' },
          { text: '', options: ['', '', '', ''], answer: '' },
        ]
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الفيديو');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) return;
    try {
      await api.deleteVideo(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  }

  // Group definitions
  const groups = [
    { grade: 'GRADE_11' as const, branch: 'SCIENTIFIC' as const, title: 'الحادي عشر — الفرع العلمي' },
    { grade: 'GRADE_11' as const, branch: 'LITERARY' as const, title: 'الحادي عشر — الفرع الأدبي' },
    { grade: 'GRADE_12' as const, branch: 'SCIENTIFIC' as const, title: 'الثاني عشر — الفرع العلمي' },
    { grade: 'GRADE_12' as const, branch: 'LITERARY' as const, title: 'الثاني عشر — الفرع الأدبي' },
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>إدارة المحتوى والدروس</h1>
          <p>تنظيم وإدارة الفيديوهات التعليمية والدروس المرفوعة لكل مادة دراسية.</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>جاري تحميل الدروس والمواد...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {groups.map((group) => {
            const groupSubjects = subjects.filter((s) => s.grade === group.grade && s.branch === group.branch);
            if (groupSubjects.length === 0) return null;

            return (
              <div key={group.title} className="card" style={{ padding: '1.5rem' }}>
                <h2 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '1.25rem',
                  borderBottom: '2px solid #f1f5f9',
                  paddingBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>🎓</span> {group.title}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {groupSubjects.map((sub) => {
                    const isExpanded = !!expandedSubjects[sub.id];
                    const subjectVideos = videos.filter((v) => v.subjectId === sub.id);

                    return (
                      <div key={sub.id} style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: '#ffffff',
                        overflow: 'hidden',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                      }}>
                        {/* Collapsible Header */}
                        <div
                          onClick={() => toggleSubject(sub.id)}
                          style={{
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            background: isExpanded ? '#f8fafc' : '#ffffff',
                            transition: 'background 0.2s',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.25rem' }}>📚</span>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>{sub.name}</h4>
                              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                المعلم: {sub.teacher?.name ?? 'غير معين'}
                              </p>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <span className="badge badge-success" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                              {subjectVideos.length} دروس
                            </span>
                            <span style={{
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s',
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)'
                            }}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div style={{
                            padding: '1.25rem',
                            borderTop: '1px solid #e2e8f0',
                            background: '#fcfdfe'
                          }}>
                            {/* Actions inside subject */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>قائمة فيديوهات الدرس</h5>
                              <button
                                className="btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '8px' }}
                                onClick={() => setUploadSubjectId(sub.id)}
                              >
                                + إضافة فيديو للمادة
                              </button>
                            </div>

                            {/* Videos Table */}
                            <div className="table-wrap" style={{ margin: 0, border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                              <table>
                                <thead>
                                  <tr>
                                    <th>عنوان الدرس</th>
                                    <th>المدة</th>
                                    <th>المرفق</th>
                                    <th>عدد المشاهدات</th>
                                    <th>الحالة</th>
                                    <th>الإجراءات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subjectVideos.map((v) => (
                                    <tr key={v.id}>
                                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{v.title}</td>
                                      <td>{formatDuration(v.durationSec)}</td>
                                      <td>
                                        {v.pdfUrl ? (
                                          <a 
                                            href={v.pdfUrl} 
                                            target="_blank" 
                                            rel="noreferrer" 
                                            style={{ 
                                              display: 'inline-flex', 
                                              alignItems: 'center', 
                                              gap: '4px', 
                                              color: 'var(--accent)', 
                                              fontWeight: 700, 
                                              fontSize: '0.8rem',
                                              textDecoration: 'underline'
                                            }}
                                          >
                                            📁 عرض المرفق
                                          </a>
                                        ) : (
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>لا يوجد</span>
                                        )}
                                      </td>
                                      <td style={{ fontWeight: 600 }}>{v._count.videoViews} مشاهدة</td>
                                      <td>
                                        <span className={`badge ${v.status === 'PUBLISHED' ? 'badge-success' : 'badge-muted'}`}>
                                          {v.status === 'PUBLISHED' ? 'منشور' : 'مسودة'}
                                        </span>
                                      </td>
                                      <td>
                                        <button
                                          className="btn-danger"
                                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: '6px' }}
                                          onClick={() => handleDelete(v.id)}
                                        >
                                          حذف
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                  {subjectVideos.length === 0 && (
                                    <tr>
                                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem', fontSize: '0.85rem' }}>
                                        لا توجد فيديوهات مضافة لهذه المادة بعد. اضغط على "+ إضافة فيديو للمادة" للبدء بالرفع.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Video Modal */}
      {uploadSubjectId && (
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
            maxWidth: '550px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              إضافة فيديو جديد لمادة: {subjects.find(s => s.id === uploadSubjectId)?.name}
            </h3>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>عنوان الدرس</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="مثال: الدرس الأول: مقدمة في المادة"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>الوصف</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="شرح مبسط وموجز لمحتوى الدرس..."
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>رفع ملف فيديو الدرس</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                />
                {uploadingVideo && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginTop: '0.2rem' }}>جاري رفع الفيديو...</span>}
                
                <label style={{ display: 'block', margin: '0.5rem 0 0.4rem 0', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>أو رابط البث (HLS URL)</label>
                <input
                  value={form.streamUrl}
                  onChange={(e) => setForm({ ...form, streamUrl: e.target.value })}
                  placeholder="https://example.com/videos/stream.m3u8 أو يتم تعبئته تلقائياً عند الرفع"
                />
                {form.streamUrl && form.streamUrl.startsWith('/uploads') && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✅ تم رفع الفيديو بنجاح:</span>
                    <span style={{ fontWeight: 'bold' }}>{form.streamUrl.split('/').pop()}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>الملف المرفق (PDF, ZIP, إلخ)</label>
                <input
                  type="file"
                  onChange={handleAttachmentUpload}
                  style={{ fontSize: '0.85rem' }}
                />
                {uploadingAttachment && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'block', marginTop: '0.2rem' }}>جاري الرفع...</span>}
                {form.pdfUrl && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✅ تم رفع المرفق بنجاح:</span>
                    <a href={form.pdfUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit', fontWeight: 'bold' }}>
                      {form.pdfUrl.split('/').pop()}
                    </a>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🧠</span> أسئلة اختبار الدرس (بنك الأسئلة - اختياري)
                </h4>
                
                {form.questions.map((q, qIdx) => (
                  <div key={qIdx} style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', marginBottom: '0.75rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#475569', marginBottom: '0.5rem' }}>
                      السؤال {qIdx + 1}
                    </div>
                    <input
                      value={q.text}
                      onChange={(e) => {
                        const newQuestions = [...form.questions];
                        newQuestions[qIdx].text = e.target.value;
                        setForm({ ...form, questions: newQuestions });
                      }}
                      placeholder={`نص السؤال (مثال: ما هي وحدة قياس القوة؟)`}
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {q.options.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          value={opt}
                          onChange={(e) => {
                            const newQuestions = [...form.questions];
                            newQuestions[qIdx].options[oIdx] = e.target.value;
                            setForm({ ...form, questions: newQuestions });
                          }}
                          placeholder={`الخيار ${oIdx + 1}`}
                          style={{ padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      ))}
                    </div>
                    <select
                      value={q.answer}
                      onChange={(e) => {
                        const newQuestions = [...form.questions];
                        newQuestions[qIdx].answer = e.target.value;
                        setForm({ ...form, questions: newQuestions });
                      }}
                      style={{ width: '100%', padding: '0.4rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    >
                      <option value="">-- اختر الإجابة الصحيحة --</option>
                      {q.options.map((opt, oIdx) => (
                        opt ? <option key={oIdx} value={opt}>{opt}</option> : null
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ الدرس</button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => {
                  setUploadSubjectId(null);
                  setForm({
                    title: '',
                    description: '',
                    streamUrl: '',
                    pdfUrl: '',
                    questions: [
                      { text: '', options: ['', '', '', ''], answer: '' },
                      { text: '', options: ['', '', '', ''], answer: '' },
                      { text: '', options: ['', '', '', ''], answer: '' },
                    ]
                  });
                }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
