import { useState, useEffect, FormEvent } from 'react';
import { api, Subject, Unit, Question } from '../api/client';

type ActiveLevel = 'grades' | 'subjects' | 'units' | 'questions';

interface GradeGroup {
  key: string;
  grade: 'GRADE_11' | 'GRADE_12';
  branch: 'SCIENTIFIC' | 'LITERARY';
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

const GRADE_GROUPS: GradeGroup[] = [
  { key: 'GRADE_11__SCIENTIFIC', grade: 'GRADE_11', branch: 'SCIENTIFIC', label: 'الحادي عشر — العلمي', icon: '🔬', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'GRADE_11__LITERARY',  grade: 'GRADE_11', branch: 'LITERARY',  label: 'الحادي عشر — الأدبي', icon: '📖', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'GRADE_12__SCIENTIFIC', grade: 'GRADE_12', branch: 'SCIENTIFIC', label: 'الثاني عشر — العلمي', icon: '⚗️', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'GRADE_12__LITERARY',  grade: 'GRADE_12', branch: 'LITERARY',  label: 'الثاني عشر — الأدبي', icon: '✍️', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
];

function FolderIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
    </svg>
  );
}

export default function QuestionBankPage() {
  const [level, setLevel] = useState<ActiveLevel>('grades');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Navigation state
  const [selectedGroup, setSelectedGroup] = useState<GradeGroup | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Unit Modal / Form state
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitOrder, setUnitOrder] = useState('1');

  // Question Modal / Form state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState('');
  const [questionOrder, setQuestionOrder] = useState('1');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [choices, setChoices] = useState<Array<{ text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Load all subjects on mount
  useEffect(() => {
    loadAllSubjects();
  }, []);

  async function loadAllSubjects() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSubjects();
      setSubjects(data);
    } catch (err: any) {
      setError(err?.message || 'فشل تحميل المواد الدراسية');
    } finally {
      setLoading(false);
    }
  }

  // ─── NAVIGATION ─────────────────────────────────────────────────────────────
  function navigateToGrades() {
    setLevel('grades');
    setSelectedGroup(null);
    setSelectedSubject(null);
    setSelectedUnit(null);
  }

  function navigateToSubjects(group: GradeGroup) {
    setSelectedGroup(group);
    setSelectedSubject(null);
    setSelectedUnit(null);
    setLevel('subjects');
  }

  async function navigateToUnits(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedUnit(null);
    setLevel('units');
    await loadUnits(subject.id);
  }

  async function navigateToQuestions(unit: Unit) {
    setSelectedUnit(unit);
    setLevel('questions');
    await loadQuestions(unit.id);
  }

  // ─── UNIT API ──────────────────────────────────────────────────────────────
  async function loadUnits(subjectId: string) {
    setLoading(true);
    try {
      const data = await api.getSubjectUnits(subjectId);
      setUnits(data);
    } catch (err) {
      alert('فشل تحميل الوحدات');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnitSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSubject) return;
    if (!unitName.trim()) return alert('الرجاء إدخال اسم الوحدة');
    setLoading(true);
    try {
      if (editingUnit) {
        await api.updateUnit(editingUnit.id, {
          name: unitName,
          order: Number(unitOrder),
        });
      } else {
        await api.createUnit(selectedSubject.id, {
          name: unitName,
          order: Number(unitOrder),
        });
      }
      setShowUnitModal(false);
      setUnitName('');
      setUnitOrder('1');
      setEditingUnit(null);
      await loadUnits(selectedSubject.id);
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ الوحدة');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUnit(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه الوحدة؟ سيتم حذف جميع الأسئلة المرتبطة بها نهائياً.')) return;
    if (!selectedSubject) return;
    setLoading(true);
    try {
      await api.deleteUnit(id);
      await loadUnits(selectedSubject.id);
    } catch (err) {
      alert('فشل حذف الوحدة');
    } finally {
      setLoading(false);
    }
  }

  // ─── QUESTION API ──────────────────────────────────────────────────────────
  async function loadQuestions(unitId: string) {
    setLoading(true);
    try {
      const data = await api.getUnitQuestions(unitId);
      setQuestions(data);
    } catch (err) {
      alert('فشل تحميل الأسئلة');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const r = await api.uploadFile(file);
      setQuestionImageUrl(r.url);
    } catch (err) {
      alert('فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleQuestionSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedUnit) return;
    if (!questionText.trim()) return alert('الرجاء إدخال نص السؤال');

    const filteredChoices = choices.map(c => ({
      text: c.text.trim(),
      isCorrect: c.isCorrect,
    }));

    if (filteredChoices.length < 2) {
      return alert('يجب إضافة خيارين على الأقل');
    }
    if (filteredChoices.some(c => !c.text)) {
      return alert('الرجاء تعبئة جميع نصوص الخيارات');
    }
    if (!filteredChoices.some(c => c.isCorrect)) {
      return alert('يجب تحديد خيار واحد صحيح على الأقل');
    }

    setLoading(true);
    try {
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, {
          text: questionText,
          imageUrl: questionImageUrl || undefined,
          order: Number(questionOrder),
          choices: filteredChoices,
        });
      } else {
        await api.createQuestion(selectedUnit.id, {
          text: questionText,
          imageUrl: questionImageUrl || undefined,
          order: Number(questionOrder),
          choices: filteredChoices,
        });
      }
      setShowQuestionModal(false);
      setQuestionText('');
      setQuestionImageUrl('');
      setQuestionOrder('1');
      setEditingQuestion(null);
      setChoices([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      await loadQuestions(selectedUnit.id);
    } catch (err: any) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ السؤال');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    if (!selectedUnit) return;
    setLoading(true);
    try {
      await api.deleteQuestion(id);
      await loadQuestions(selectedUnit.id);
    } catch (err) {
      alert('فشل حذف السؤال');
    } finally {
      setLoading(false);
    }
  }

  // Choices Helpers
  function handleAddChoice() {
    if (choices.length >= 6) return alert('الحد الأقصى للخيارات هو 6 خيارات');
    setChoices([...choices, { text: '', isCorrect: false }]);
  }

  function handleRemoveChoice(index: number) {
    if (choices.length <= 2) return alert('يجب أن يحتوي السؤال على خيارين على الأقل');
    setChoices(choices.filter((_, i) => i !== index));
  }

  function handleChoiceTextChange(index: number, text: string) {
    const next = [...choices];
    next[index].text = text;
    setChoices(next);
  }

  function handleChoiceCorrectChange(index: number) {
    const next = choices.map((c, i) => ({
      ...c,
      isCorrect: i === index,
    }));
    setChoices(next);
  }

  // Filtered subjects for current group
  const groupSubjects = selectedGroup
    ? subjects.filter((s) => s.grade === selectedGroup.grade && s.branch === selectedGroup.branch)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', direction: 'rtl' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>بنك الأسئلة</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إدارة أسئلة وتمارين المراحل الدراسية والوحدات</p>
        </div>

        {/* Action Buttons */}
        <div>
          {level === 'units' && selectedSubject && (
            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitName('');
                setUnitOrder(String(units.length + 1));
                setShowUnitModal(true);
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>➕</span> إضافة وحدة جديدة
            </button>
          )}

          {level === 'questions' && selectedUnit && (
            <button
              onClick={() => {
                setEditingQuestion(null);
                setQuestionText('');
                setQuestionImageUrl('');
                setQuestionOrder(String(questions.length + 1));
                setChoices([
                  { text: '', isCorrect: false },
                  { text: '', isCorrect: false },
                ]);
                setShowQuestionModal(true);
              }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>➕</span> إضافة سؤال جديد
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        <button
          onClick={navigateToGrades}
          style={{
            background: 'none', border: 'none', cursor: level === 'grades' ? 'default' : 'pointer',
            fontWeight: level === 'grades' ? 700 : 500,
            color: level === 'grades' ? 'var(--text)' : 'var(--accent)',
            fontSize: '0.85rem', padding: '0.2rem 0.3rem',
            textDecoration: level === 'grades' ? 'none' : 'underline',
          }}
        >
          📝 بنك الأسئلة
        </button>

        {selectedGroup && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <button
              onClick={() => navigateToSubjects(selectedGroup)}
              style={{
                background: 'none', border: 'none', cursor: level === 'subjects' ? 'default' : 'pointer',
                fontWeight: level === 'subjects' ? 700 : 500,
                color: level === 'subjects' ? 'var(--text)' : 'var(--accent)',
                fontSize: '0.85rem', padding: '0.2rem 0.3rem',
                textDecoration: level === 'subjects' ? 'none' : 'underline',
              }}
            >
              {selectedGroup.label}
            </button>
          </>
        )}

        {selectedSubject && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <button
              onClick={() => navigateToUnits(selectedSubject)}
              style={{
                background: 'none', border: 'none', cursor: level === 'units' ? 'default' : 'pointer',
                fontWeight: level === 'units' ? 700 : 500,
                color: level === 'units' ? 'var(--text)' : 'var(--accent)',
                fontSize: '0.85rem', padding: '0.2rem 0.3rem',
                textDecoration: level === 'units' ? 'none' : 'underline',
              }}
            >
              {selectedSubject.name}
            </button>
          </>
        )}

        {selectedUnit && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <span style={{ color: 'var(--text)', fontWeight: 700, padding: '0.2rem 0.3rem' }}>
              {selectedUnit.name}
            </span>
          </>
        )}
      </nav>

      {error && (
        <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* Main Content Area */}
      {loading && !showUnitModal && !showQuestionModal ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
          <span style={{ marginRight: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>جاري التحميل...</span>
        </div>
      ) : (
        <>
          {/* ─── LEVEL 0: GRADE GROUPS ────────────────────────────────────── */}
          {level === 'grades' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
              {GRADE_GROUPS.map((g) => {
                const count = subjects.filter((s) => s.grade === g.grade && s.branch === g.branch).length;
                return (
                  <button
                    key={g.key}
                    onClick={() => navigateToSubjects(g)}
                    style={{
                      background: g.bg,
                      border: `1.5px solid ${g.border}`,
                      borderRadius: '16px',
                      padding: '1.5rem 1.25rem',
                      cursor: 'pointer',
                      textAlign: 'right',
                      transition: 'all 0.18s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{g.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: g.color, marginBottom: '0.3rem' }}>
                        {g.label}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {count} مادة دراسية
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.25rem' }}>
                      <FolderIcon color={g.color} />
                      <span style={{ fontSize: '0.78rem', color: g.color, fontWeight: 600 }}>عرض المواد والأسئلة</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ─── LEVEL 1: SUBJECTS ───────────────────────────────────────── */}
          {level === 'subjects' && selectedGroup && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
              {groupSubjects.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                  <div>لا توجد أي مواد دراسية مضافة لهذه المرحلة حالياً.</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>يمكنك إضافة المواد من خانة "المحتوى والدروس".</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {groupSubjects.map((subj) => (
                    <div
                      key={subj.id}
                      onClick={() => navigateToUnits(subj)}
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.35rem' }}>
                          📚 {subj.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {subj.teacher ? `المعلم: ${subj.teacher.name}` : 'بدون معلم معين'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {subj._count?.units ? `${subj._count.units} وحدة` : 'عرض الوحدات'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
                          فتح بنك الأسئلة ←
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── LEVEL 2: UNITS ─────────────────────────────────────────── */}
          {level === 'units' && selectedSubject && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
              {units.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                  <div>لا توجد أي وحدات لهذه المادة حالياً.</div>
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      onClick={() => {
                        setEditingUnit(null);
                        setUnitName('');
                        setUnitOrder('1');
                        setShowUnitModal(true);
                      }}
                      className="btn-primary"
                    >
                      ➕ إضافة الوحدة الأولى
                    </button>
                  </div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'right', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem', width: '80px' }}>الترتيب</th>
                      <th style={{ padding: '0.75rem' }}>اسم الوحدة</th>
                      <th style={{ padding: '0.75rem', width: '120px' }}>عدد الأسئلة</th>
                      <th style={{ padding: '0.75rem', width: '220px', textAlign: 'center' }}>العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr key={unit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{unit.order}</td>
                        <td
                          onClick={() => navigateToQuestions(unit)}
                          style={{ padding: '0.75rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}
                        >
                          <span style={{ textDecoration: 'underline' }}>{unit.name}</span>
                          <span style={{ fontSize: '0.75rem', marginRight: '8px', color: 'var(--text-muted)' }}>🔍 (عرض الأسئلة)</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ padding: '0.2rem 0.6rem', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                            {unit._count?.questions || 0} أسئلة
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => navigateToQuestions(unit)}
                            className="btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            الأسئلة
                          </button>
                          <button
                            onClick={() => {
                              setEditingUnit(unit);
                              setUnitName(unit.name);
                              setUnitOrder(String(unit.order));
                              setShowUnitModal(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger-text)', background: 'var(--danger-bg)' }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ─── LEVEL 3: QUESTIONS ─────────────────────────────────────── */}
          {level === 'questions' && selectedUnit && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem' }}>
              {questions.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❓</div>
                  <div>لا توجد أي أسئلة مضافة في هذه الوحدة حالياً.</div>
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      onClick={() => {
                        setEditingQuestion(null);
                        setQuestionText('');
                        setQuestionImageUrl('');
                        setQuestionOrder('1');
                        setChoices([
                          { text: '', isCorrect: false },
                          { text: '', isCorrect: false },
                        ]);
                        setShowQuestionModal(true);
                      }}
                      className="btn-primary"
                    >
                      ➕ إضافة السؤال الأول
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        background: '#ffffff',
                      }}
                    >
                      {/* Question Top */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>سؤال {q.order}</span>
                          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', whiteSpace: 'pre-wrap', margin: 0 }}>{q.text}</p>
                          {q.imageUrl && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <img src={q.imageUrl} alt="سؤال" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setEditingQuestion(q);
                              setQuestionText(q.text);
                              setQuestionImageUrl(q.imageUrl || '');
                              setQuestionOrder(String(q.order));
                              setChoices(q.choices.map(c => ({ text: c.text, isCorrect: c.isCorrect })));
                              setShowQuestionModal(true);
                            }}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--danger-text)', background: 'var(--danger-bg)' }}
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </div>

                      {/* Choices List */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                        {q.choices.map((choice) => (
                          <div
                            key={choice.id}
                            style={{
                              padding: '0.6rem 0.85rem',
                              borderRadius: '6px',
                              border: choice.isCorrect ? '1.5px solid var(--success)' : '1px solid var(--border)',
                              background: choice.isCorrect ? 'var(--success-bg)' : '#f8fafc',
                              color: choice.isCorrect ? 'var(--success-text)' : 'var(--text)',
                              fontSize: '0.85rem',
                              fontWeight: choice.isCorrect ? 700 : 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <span>{choice.isCorrect ? '✅' : '⚪'}</span>
                            <span>{choice.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─── UNIT MODAL ───────────────────────────────────────────────────────── */}
      {showUnitModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>{editingUnit ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}</h3>
            <form onSubmit={handleUnitSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>اسم الوحدة</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="مثال: الوحدة الأولى: التفاضل والتكامل"
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>ترتيب الوحدة (الرقم الترتيبي)</label>
                <input
                  type="number"
                  min="1"
                  value={unitOrder}
                  onChange={(e) => setUnitOrder(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ</button>
                <button type="button" onClick={() => setShowUnitModal(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── QUESTION MODAL ───────────────────────────────────────────────────── */}
      {showQuestionModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 0' }}>
          <div className="modal-content" style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-lg)', margin: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>{editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</h3>
            <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Question Text */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>نص السؤال</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="اكتب نص السؤال هنا بالتفصيل..."
                  rows={3}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Order and Image Upload Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>الترتيب</label>
                  <input
                    type="number"
                    min="1"
                    value={questionOrder}
                    onChange={(e) => setQuestionOrder(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>صورة توضيحية (اختياري)</label>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '0.8rem' }} />
                  {uploadingImage && <span style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>جاري رفع الصورة...</span>}
                  {questionImageUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success-text)', wordBreak: 'break-all' }}>✅ تم الرفع</span>
                      <button type="button" onClick={() => setQuestionImageUrl('')} style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: '4px' }}>حذف</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Choices section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>خيارات الإجابة</h4>
                  <button type="button" onClick={handleAddChoice} className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
                    ➕ إضافة خيار ({choices.length}/6)
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {choices.map((choice, cIdx) => (
                    <div
                      key={cIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: '#f8fafc',
                        padding: '0.6rem 0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {/* Radio for isCorrect */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, color: choice.isCorrect ? 'var(--success-text)' : 'var(--text-muted)' }}>
                        <input
                          type="radio"
                          name="correct-choice"
                          checked={choice.isCorrect}
                          onChange={() => handleChoiceCorrectChange(cIdx)}
                          style={{ width: 'auto', cursor: 'pointer' }}
                        />
                        {choice.isCorrect ? 'إجابة صحيحة' : 'تحديد كصحيح'}
                      </label>

                      {/* Choice Text input */}
                      <input
                        type="text"
                        value={choice.text}
                        onChange={(e) => handleChoiceTextChange(cIdx, e.target.value)}
                        placeholder={`نص الخيار رقم ${cIdx + 1}`}
                        required
                        style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem', borderRadius: '6px' }}
                      />

                      {/* Remove Choice button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveChoice(cIdx)}
                        style={{
                          background: 'none',
                          color: 'var(--danger-text)',
                          padding: '0.25rem',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                        title="حذف هذا الخيار"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form submit/cancel buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ</button>
                <button type="button" onClick={() => setShowQuestionModal(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
