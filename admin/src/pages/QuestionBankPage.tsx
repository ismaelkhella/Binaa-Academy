import { useState, useEffect, FormEvent } from 'react';
import { api, Stage, Subject, Unit, Question } from '../api/client';

type ActiveView = 'stages' | 'subjects' | 'units' | 'questions';

export default function QuestionBankPage() {
  const [view, setView] = useState<ActiveView>('stages');
  const [stages, setStages] = useState<Stage[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Navigation / Breadcrumbs state
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);

  // Modal / Form states
  const [showStageModal, setShowStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [stageName, setStageName] = useState('');

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectGrade, setSubjectGrade] = useState('GRADE_11');
  const [subjectBranch, setSubjectBranch] = useState('SCIENTIFIC');

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitOrder, setUnitOrder] = useState('1');

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

  // Load initial view
  useEffect(() => {
    loadStages();
  }, []);

  // ─── STAGE API ─────────────────────────────────────────────────────────────
  async function loadStages() {
    setLoading(true);
    try {
      const data = await api.getStages();
      setStages(data);
    } catch (err) {
      alert('فشل تحميل المراحل الدراسية');
    } finally {
      setLoading(false);
    }
  }

  async function handleStageSubmit(e: FormEvent) {
    e.preventDefault();
    if (!stageName.trim()) return alert('الرجاء إدخال اسم المرحلة');
    setLoading(true);
    try {
      if (editingStage) {
        await api.updateStage(editingStage.id, { name: stageName });
      } else {
        await api.createStage({ name: stageName });
      }
      setShowStageModal(false);
      setStageName('');
      setEditingStage(null);
      loadStages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المرحلة');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteStage(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المرحلة؟ سيؤدي ذلك إلى إلغاء ربط المواد المرتبطة بها.')) return;
    setLoading(true);
    try {
      await api.deleteStage(id);
      loadStages();
    } catch (err) {
      alert('فشل حذف المرحلة الدراسية');
    } finally {
      setLoading(false);
    }
  }

  // ─── SUBJECT API ───────────────────────────────────────────────────────────
  async function loadSubjects(stageId: string) {
    setLoading(true);
    try {
      const data = await api.getStageSubjects(stageId);
      setSubjects(data);
    } catch (err) {
      alert('فشل تحميل المواد الدراسية');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubjectSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedStage) return;
    if (!subjectName.trim()) return alert('الرجاء إدخال اسم المادة');
    setLoading(true);
    try {
      if (editingSubject) {
        await api.updateQbSubject(editingSubject.id, {
          name: subjectName,
          grade: subjectGrade,
          branch: subjectBranch,
        });
      } else {
        await api.createStageSubject(selectedStage.id, {
          name: subjectName,
          grade: subjectGrade,
          branch: subjectBranch,
        });
      }
      setShowSubjectModal(false);
      setSubjectName('');
      setEditingSubject(null);
      loadSubjects(selectedStage.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء حفظ المادة');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSubject(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟ سيتم حذف جميع الوحدات والأسئلة المرتبطة بها نهائياً.')) return;
    if (!selectedStage) return;
    setLoading(true);
    try {
      await api.deleteQbSubject(id);
      loadSubjects(selectedStage.id);
    } catch (err) {
      alert('فشل حذف المادة');
    } finally {
      setLoading(false);
    }
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
      loadUnits(selectedSubject.id);
    } catch (err) {
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
      loadUnits(selectedSubject.id);
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

    // Filter out empty choice options, although client-side validation requires they have texts.
    const filteredChoices = choices.map(c => ({
      text: c.text.trim(),
      isCorrect: c.isCorrect,
    }));

    if (filteredChoices.some(c => !c.text)) {
      return alert('الرجاء تعبئة جميع نصوص الاختيارات المضافة');
    }

    if (filteredChoices.length < 2) {
      return alert('يجب إضافة اختيارين على الأقل');
    }

    const correctCount = filteredChoices.filter(c => c.isCorrect).length;
    if (correctCount === 0) {
      return alert('الرجاء اختيار إجابة صحيحة واحدة على الأقل');
    }

    setLoading(true);
    try {
      const payload = {
        text: questionText,
        imageUrl: questionImageUrl || undefined,
        order: Number(questionOrder),
        choices: filteredChoices,
      };

      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, payload);
      } else {
        await api.createQuestion(selectedUnit.id, payload);
      }
      setShowQuestionModal(false);
      setQuestionText('');
      setQuestionImageUrl('');
      setQuestionOrder('1');
      setChoices([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ]);
      setEditingQuestion(null);
      loadQuestions(selectedUnit.id);
    } catch (err) {
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
      loadQuestions(selectedUnit.id);
    } catch (err) {
      alert('فشل حذف السؤال');
    } finally {
      setLoading(false);
    }
  }

  // Choices Helpers
  function handleAddChoice() {
    if (choices.length >= 6) return alert('الحد الأقصى هو 6 اختيارات');
    setChoices([...choices, { text: '', isCorrect: false }]);
  }

  function handleRemoveChoice(index: number) {
    if (choices.length <= 2) return alert('يجب الحفاظ على اختيارين كحد أدنى');
    const updated = choices.filter((_, i) => i !== index);
    // If the removed choice was correct, reset correct selection to none
    setChoices(updated);
  }

  function handleChoiceTextChange(index: number, val: string) {
    const updated = [...choices];
    updated[index].text = val;
    setChoices(updated);
  }

  function handleChoiceCorrectChange(index: number) {
    const updated = choices.map((c, i) => ({
      ...c,
      isCorrect: i === index,
    }));
    setChoices(updated);
  }

  // ─── NAVIGATION FLOW ───────────────────────────────────────────────────────
  function clickStage(stage: Stage) {
    setSelectedStage(stage);
    setSelectedSubject(null);
    setSelectedUnit(null);
    setView('subjects');
    loadSubjects(stage.id);
  }

  function clickSubject(subject: Subject) {
    setSelectedSubject(subject);
    setSelectedUnit(null);
    setView('units');
    loadUnits(subject.id);
  }

  function clickUnit(unit: Unit) {
    setSelectedUnit(unit);
    setView('questions');
    loadQuestions(unit.id);
  }

  function resetToStages() {
    setSelectedStage(null);
    setSelectedSubject(null);
    setSelectedUnit(null);
    setView('stages');
    loadStages();
  }

  function resetToSubjects() {
    if (selectedStage) {
      setSelectedSubject(null);
      setSelectedUnit(null);
      setView('subjects');
      loadSubjects(selectedStage.id);
    }
  }

  function resetToUnits() {
    if (selectedStage && selectedSubject) {
      setSelectedUnit(null);
      setView('units');
      loadUnits(selectedSubject.id);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', direction: 'rtl' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>بنك الأسئلة</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إدارة المراحل الدراسية، المواد، الوحدات، والأسئلة</p>
        </div>

        {/* Dynamic Action Buttons based on current view */}
        <div>
          {view === 'stages' && (
            <button
              onClick={() => {
                setEditingStage(null);
                setStageName('');
                setShowStageModal(true);
              }}
              className="btn-primary"
            >
              ➕ إضافة مرحلة
            </button>
          )}
          {view === 'subjects' && selectedStage && (
            <button
              onClick={() => {
                setEditingSubject(null);
                setSubjectName('');
                setSubjectGrade('GRADE_11');
                setSubjectBranch('SCIENTIFIC');
                setShowSubjectModal(true);
              }}
              className="btn-primary"
            >
              ➕ إضافة مادة
            </button>
          )}
          {view === 'units' && selectedSubject && (
            <button
              onClick={() => {
                setEditingUnit(null);
                setUnitName('');
                setUnitOrder(String(units.length + 1));
                setShowUnitModal(true);
              }}
              className="btn-primary"
            >
              ➕ إضافة وحدة
            </button>
          )}
          {view === 'questions' && selectedUnit && (
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
            >
              ➕ إضافة سؤال
            </button>
          )}
        </div>
      </div>

      {/* Interactive Breadcrumb Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
      >
        <span
          onClick={resetToStages}
          style={{
            cursor: 'pointer',
            color: view === 'stages' ? 'var(--text)' : 'var(--accent)',
            textDecoration: view === 'stages' ? 'none' : 'underline',
          }}
        >
          بنك الأسئلة
        </span>

        {selectedStage && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
            <span
              onClick={resetToSubjects}
              style={{
                cursor: 'pointer',
                color: view === 'subjects' ? 'var(--text)' : 'var(--accent)',
                textDecoration: view === 'subjects' ? 'none' : 'underline',
              }}
            >
              {selectedStage.name}
            </span>
          </>
        )}

        {selectedSubject && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
            <span
              onClick={resetToUnits}
              style={{
                cursor: 'pointer',
                color: view === 'units' ? 'var(--text)' : 'var(--accent)',
                textDecoration: view === 'units' ? 'none' : 'underline',
              }}
            >
              {selectedSubject.name}
            </span>
          </>
        )}

        {selectedUnit && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>&gt;</span>
            <span style={{ color: 'var(--text)' }}>
              {selectedUnit.name}
            </span>
          </>
        )}
      </div>

      {/* Page Loading Overlay or Listing */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--accent)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
          <span style={{ marginRight: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>جاري التحميل...</span>
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          
          {/* STAGES VIEW */}
          {view === 'stages' && (
            <div style={{ padding: '1.25rem' }}>
              {stages.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا يوجد أي مراحل دراسية حالياً. أضف مرحلة جديدة للبدء.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {stages.map((stage) => (
                    <div
                      key={stage.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        background: '#fff',
                        transition: 'box-shadow 0.15s ease',
                      }}
                    >
                      <div onClick={() => clickStage(stage)} style={{ cursor: 'pointer' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                          {stage.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          عدد المواد: {stage._count?.subjects || 0}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <button
                          onClick={() => {
                            setEditingStage(stage);
                            setStageName(stage.name);
                            setShowStageModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger-text)', background: 'var(--danger-bg)', flex: 1 }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUBJECTS VIEW */}
          {view === 'subjects' && selectedStage && (
            <div style={{ padding: '1.25rem' }}>
              {subjects.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا يوجد أي مواد لهذه المرحلة حالياً. أضف مادة جديدة.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {subjects.map((subj) => (
                    <div
                      key={subj.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        background: '#fff',
                      }}
                    >
                      <div onClick={() => clickSubject(subj)} style={{ cursor: 'pointer' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
                          {subj.name}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            {subj.grade === 'GRADE_11' ? 'الصف الحادي عشر' : 'الصف الثاني عشر'}
                          </span>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                            {subj.branch === 'SCIENTIFIC' ? 'علمي' : 'أدبي'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          عدد الوحدات: {(subj as any)._count?.units || 0}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                        <button
                          onClick={() => {
                            setEditingSubject(subj);
                            setSubjectName(subj.name);
                            setSubjectGrade(subj.grade);
                            setSubjectBranch(subj.branch);
                            setShowSubjectModal(true);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', flex: 1 }}
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(subj.id)}
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger-text)', background: 'var(--danger-bg)', flex: 1 }}
                        >
                          🗑️ حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* UNITS VIEW */}
          {view === 'units' && selectedSubject && (
            <div style={{ padding: '1.25rem' }}>
              {units.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا يوجد أي وحدات لهذه المادة حالياً. أضف وحدة جديدة للبدء.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'right', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>الترتيب</th>
                      <th style={{ padding: '0.75rem' }}>اسم الوحدة</th>
                      <th style={{ padding: '0.75rem' }}>عدد الأسئلة</th>
                      <th style={{ padding: '0.75rem', width: '200px', textAlign: 'center' }}>العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr key={unit.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{unit.order}</td>
                        <td
                          onClick={() => clickUnit(unit)}
                          style={{ padding: '0.75rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {unit.name}
                        </td>
                        <td style={{ padding: '0.75rem' }}>{unit._count?.questions || 0}</td>
                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
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
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* QUESTIONS VIEW */}
          {view === 'questions' && selectedUnit && (
            <div style={{ padding: '1.25rem' }}>
              {questions.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>لا يوجد أي أسئلة مضافة في هذه الوحدة حالياً.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      style={{
                        padding: '1.25rem',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        background: '#f8fafc',
                      }}
                    >
                      {/* Question Top Section */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>سؤال {q.order}</span>
                          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{q.text}</p>
                          {q.imageUrl && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <img src={q.imageUrl} alt="سؤال" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
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

                      {/* Question Choices */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem', marginTop: '1rem', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem' }}>
                        {q.choices.map((choice) => (
                          <div
                            key={choice.id}
                            style={{
                              padding: '0.6rem 0.85rem',
                              borderRadius: '6px',
                              border: choice.isCorrect ? '1.5px solid var(--success)' : '1px solid var(--border)',
                              background: choice.isCorrect ? 'var(--success-bg)' : '#ffffff',
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

        </div>
      )}

      {/* ─── STAGE MODAL ──────────────────────────────────────────────────────── */}
      {showStageModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>{editingStage ? 'تعديل مرحلة' : 'إضافة مرحلة جديدة'}</h3>
            <form onSubmit={handleStageSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>اسم المرحلة الدراسية</label>
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  placeholder="مثال: الصف الثاني عشر علمي"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ</button>
                <button type="button" onClick={() => setShowStageModal(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUBJECT MODAL ────────────────────────────────────────────────────── */}
      {showSubjectModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '1.5rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 800 }}>{editingSubject ? 'تعديل مادة' : 'إضافة مادة جديدة'}</h3>
            <form onSubmit={handleSubjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>اسم المادة</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="مثال: الرياضيات"
                  required
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>المرحلة الدراسية في النظام</label>
                <select value={subjectGrade} onChange={(e) => setSubjectGrade(e.target.value)} style={{ width: '100%' }}>
                  <option value="GRADE_11">الصف الحادي عشر</option>
                  <option value="GRADE_12">الصف الثاني عشر</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>الفرع</label>
                <select value={subjectBranch} onChange={(e) => setSubjectBranch(e.target.value)} style={{ width: '100%' }}>
                  <option value="SCIENTIFIC">علمي</option>
                  <option value="LITERARY">أدبي</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>حفظ</button>
                <button type="button" onClick={() => setShowSubjectModal(false)} className="btn-secondary" style={{ flex: 1 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
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
