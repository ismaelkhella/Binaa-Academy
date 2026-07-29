import { useEffect, useState } from 'react';
import { api, Student, Subject, StudentDetail } from '../api/client';
import { gradeLabel, branchLabel, planLabel, formatDate } from '../utils/labels';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [branch, setBranch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Student Profile Modal State
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'performance' | 'subscription'>('info');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [editParentPhone, setEditParentPhone] = useState('');

  function load() {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (grade) params.grade = grade;
    if (branch) params.branch = branch;
    Promise.all([
      api.getStudents(params),
      api.getSubjects()
    ])
      .then(([studentsData, subjectsData]) => {
        setStudents(studentsData);
        setSubjects(subjectsData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleFreeze(id: string, freeze: boolean) {
    const confirmation = freeze
      ? 'تجميد الاشتراك لهذا الطالب؟'
      : 'إلغاء تجميد الاشتراك لهذا الطالب؟';
    if (!confirm(confirmation)) return;
    try {
      await api.freezeSubscription(id, freeze, freeze ? 'Manual Admin Freeze' : undefined);
      if (profileStudent && profileStudent.id === id) {
        loadStudentDetail(id);
      }
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء تعديل الاشتراك');
    }
  }

  async function loadStudentDetail(id: string) {
    setLoadingDetail(true);
    setDetailError('');
    try {
      const data = await api.getStudent(id);
      setStudentDetail(data);
      setEditParentPhone(data.parentPhone || '');
      
      const activeSub = data.subscriptions.find((sub) => sub.isActive);
      if (activeSub) {
        setSelectedSubjectIds(activeSub.subjects.map((s) => s.subject.id));
      } else {
        setSelectedSubjectIds([]);
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات الطالب');
    } finally {
      setLoadingDetail(false);
    }
  }

  function openProfileModal(student: Student) {
    setProfileStudent(student);
    setStudentDetail(null);
    setActiveTab('info');
    loadStudentDetail(student.id);
  }

  async function handleUpdateStudentInfo() {
    if (!studentDetail) return;
    try {
      await api.updateStudent(studentDetail.id, {
        parentPhone: editParentPhone,
      });
      alert('تم تحديث رقم ولي الأمر بنجاح');
      loadStudentDetail(studentDetail.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل تحديث البيانات');
    }
  }

  async function handleToggleActive() {
    if (!studentDetail) return;
    const confirmation = studentDetail.isActive
      ? 'هل أنت متأكد من تعطيل هذا الحساب؟ لن يتمكن الطالب من الدخول للمنصة.'
      : 'تفعيل حساب الطالب؟';
    if (!confirm(confirmation)) return;
    try {
      await api.updateStudent(studentDetail.id, {
        isActive: !studentDetail.isActive,
      });
      loadStudentDetail(studentDetail.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'فشل تعديل حالة الحساب');
    }
  }

  async function submitGrant() {
    if (!profileStudent) return;
    try {
      await api.grantSubscription(
        profileStudent.id,
        'YEARLY',
        3650,
        selectedSubjectIds
      );
      alert('تم تحديث اشتراكات المواد بنجاح');
      loadStudentDetail(profileStudent.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء تفعيل الاشتراك');
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>إدارة الطلاب</h1>
          <p>عرض وإدارة حسابات الطلاب وتفعيل أو تجميد الاشتراكات والاطلاع على الأداء.</p>
        </div>
      </div>

      <div className="filters">
        <input
          placeholder="بحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={grade} onChange={(e) => setGrade(e.target.value)}>
          <option value="">كل الصفوف</option>
          <option value="GRADE_11">الصف الحادي عشر</option>
          <option value="GRADE_12">الصف الثاني عشر</option>
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
          <p style={{ color: 'var(--text-muted)' }}>جاري تحميل حسابات الطلاب...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>رقم الهاتف</th>
                  <th>اسم الطالب</th>
                  <th>الصف</th>
                  <th>الفرع</th>
                  <th>حالة الاشتراك</th>
                  <th>المشاهدات</th>
                  <th>تاريخ التسجيل</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const studentName = s.name || '—';
                  const initials = studentName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
                  
                  return (
                    <tr key={s.id}>
                      <td dir="ltr" style={{ fontWeight: 500 }}>{s.phone}</td>
                      <td>
                        <div className="student-cell">
                          <div className="avatar-circle">{initials}</div>
                          <span className="student-name">{studentName}</span>
                        </div>
                      </td>
                      <td>{gradeLabel(s.grade)}</td>
                      <td>{branchLabel(s.branch)}</td>
                      <td>
                        {s.subscription ? (
                          <span className={`badge ${s.subscription.isFrozen ? 'badge-warning' : 'badge-success'}`}>
                            {planLabel(s.subscription.planType)}
                            {s.subscription.isFrozen && ' (مجمد)'}
                          </span>
                        ) : (
                          <span className="badge badge-muted">بدون اشتراك</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.viewsCount} مشاهدة</td>
                      <td>{formatDate(s.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => openProfileModal(s)}>
                            ملف الطالب
                          </button>
                          {s.subscription && !s.subscription.isFrozen && (
                            <button className="btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleFreeze(s.id, true)}>
                              تجميد
                            </button>
                          )}
                          {s.subscription?.isFrozen && (
                            <button className="btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleFreeze(s.id, false)}>
                              إلغاء التجميد
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      لم يتم تسجيل أي طالب بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Profile Modal Overlay */}
      {profileStudent && (
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
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                ملف الطالب: {profileStudent.name || profileStudent.phone}
              </h3>
              <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.85rem' }} onClick={() => setProfileStudent(null)}>
                إغلاق
              </button>
            </div>

            {/* Error Message */}
            {detailError && <div className="error-msg">{detailError}</div>}

            {/* Tabs Row */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <button 
                style={{
                  background: activeTab === 'info' ? 'var(--primary)' : 'none',
                  color: activeTab === 'info' ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('info')}
              >
                البيانات الأساسية
              </button>
              <button 
                style={{
                  background: activeTab === 'performance' ? 'var(--primary)' : 'none',
                  color: activeTab === 'performance' ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('performance')}
              >
                النشاط والأداء
              </button>
              <button 
                style={{
                  background: activeTab === 'subscription' ? 'var(--primary)' : 'none',
                  color: activeTab === 'subscription' ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab('subscription')}
              >
                الاشتراكات والمواد
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'info' && (
              <div className="form-grid-2" style={{ gap: '1.25rem', padding: '0.5rem 0' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>الاسم الكامل</label>
                  <input value={studentDetail?.name || profileStudent.name || '—'} readOnly style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>رقم الهاتف</label>
                  <input value={profileStudent.phone} readOnly style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text)' }} dir="ltr" />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>الصف الدراسي</label>
                  <input value={gradeLabel(profileStudent.grade)} readOnly style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>الفرع / التخصص</label>
                  <input value={branchLabel(profileStudent.branch)} readOnly style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>تاريخ التسجيل</label>
                  <input value={formatDate(profileStudent.createdAt)} readOnly style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--text)' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>رقم هاتف ولي الأمر</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      value={editParentPhone} 
                      onChange={(e) => setEditParentPhone(e.target.value)} 
                      placeholder="أدخل رقم ولي الأمر..." 
                      dir="ltr"
                    />
                    <button className="btn-primary" style={{ padding: '0.35rem 1rem', fontSize: '0.8rem' }} onClick={handleUpdateStudentInfo}>
                      حفظ
                    </button>
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>حالة الحساب</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>تعطيل الحساب يمنع الطالب من تسجيل الدخول إلى المنصة.</p>
                  </div>
                  <button 
                    className={studentDetail?.isActive ? "btn-danger" : "btn-primary"} 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} 
                    onClick={handleToggleActive}
                  >
                    {studentDetail?.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div>
                {loadingDetail ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>جاري تحميل الأداء...</p>
                ) : studentDetail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Metrics Row */}
                    <div className="detail-stats-4">
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>إجمالي المشاهدات</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>{studentDetail.videoViews?.length || 0}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>جلسات الدراسة</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>{studentDetail.studySessions?.length || 0}</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>دقائق الدراسة الذاتية</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
                          {studentDetail.studySessions?.reduce((acc, curr) => acc + curr.durationMin, 0) || 0} د
                        </div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>كويزات مكتملة</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>{studentDetail.quizResults?.length || 0}</div>
                      </div>
                    </div>

                    {/* Tables grid */}
                    <div className="form-grid-2">
                      {/* Video Views */}
                      <div className="card" style={{ padding: '1rem', background: '#ffffff', minHeight: '200px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>آخر الفيديوهات المشاهدة</h4>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.8rem' }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>الفيديو</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>المشاهدات</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>الحالة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentDetail.videoViews?.map((vv, i) => (
                                <tr key={i}>
                                  <td style={{ padding: '0.4rem' }}>{vv.video.title}</td>
                                  <td style={{ padding: '0.4rem' }}>{vv.viewCount}</td>
                                  <td style={{ padding: '0.4rem' }}>
                                    <span className={`badge ${vv.completed ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                                      {vv.completed ? 'مكتمل' : 'جاري المشاهدة'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                              {(!studentDetail.videoViews || studentDetail.videoViews.length === 0) && (
                                <tr>
                                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>لا يوجد سجل مشاهدات.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Quiz Results */}
                      <div className="card" style={{ padding: '1rem', background: '#ffffff', minHeight: '200px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>نتائج الكويزات والاختبارات</h4>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.8rem' }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>الكويز</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>العلامة</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>النسبة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentDetail.quizResults?.map((qr) => {
                                const percent = Math.round((qr.score / qr.totalQuestions) * 100);
                                return (
                                  <tr key={qr.id}>
                                    <td style={{ padding: '0.4rem' }}>{qr.quiz.title}</td>
                                    <td style={{ padding: '0.4rem' }}>{qr.score} / {qr.totalQuestions}</td>
                                    <td style={{ padding: '0.4rem', fontWeight: 600 }}>{percent}%</td>
                                  </tr>
                                );
                              })}
                              {(!studentDetail.quizResults || studentDetail.quizResults.length === 0) && (
                                <tr>
                                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>لا يوجد نتائج اختبارات.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Daily Goals */}
                      <div className="card" style={{ padding: '1rem', background: '#ffffff', minHeight: '200px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>الأهداف اليومية</h4>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.8rem' }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>الهدف</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>الحالة</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>الاستحقاق</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentDetail.dailyGoals?.map((g) => (
                                <tr key={g.id}>
                                  <td style={{ padding: '0.4rem' }}>{g.title}</td>
                                  <td style={{ padding: '0.4rem' }}>
                                    <span className={`badge ${g.completed ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>
                                      {g.completed ? 'مكتمل' : 'معلق'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.4rem' }}>{formatDate(g.dueDate)}</td>
                                </tr>
                              ))}
                              {(!studentDetail.dailyGoals || studentDetail.dailyGoals.length === 0) && (
                                <tr>
                                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>لا توجد أهداف يومية.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Study Sessions */}
                      <div className="card" style={{ padding: '1rem', background: '#ffffff', minHeight: '200px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>جلسات الدراسة</h4>
                        <div style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.8rem' }}>
                          <table style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>التاريخ</th>
                                <th style={{ padding: '0.4rem', fontSize: '0.75rem', textAlign: 'right' }}>المدة</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentDetail.studySessions?.map((s) => (
                                <tr key={s.id}>
                                  <td style={{ padding: '0.4rem' }}>{formatDate(s.date)}</td>
                                  <td style={{ padding: '0.4rem', fontWeight: 600 }}>{s.durationMin} دقيقة</td>
                                </tr>
                              ))}
                              {(!studentDetail.studySessions || studentDetail.studySessions.length === 0) && (
                                <tr>
                                  <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>لا توجد جلسات دراسية مسجلة.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>فشل تحميل الأداء.</p>
                )}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div>
                {loadingDetail ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>جاري تحميل تفاصيل الاشتراك...</p>
                ) : studentDetail ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Expiry Card */}
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>حالة الاشتراك الإجمالية</span>
                        <div style={{ marginTop: '0.25rem' }}>
                          {studentDetail.subscription ? (
                            <span className={`badge ${studentDetail.subscription.isFrozen ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.85rem' }}>
                              {planLabel(studentDetail.subscription.planType)}
                              {studentDetail.subscription.isFrozen ? ' (مجمد)' : ' (نشط)'}
                            </span>
                          ) : (
                            <span className="badge badge-muted" style={{ fontSize: '0.85rem' }}>بدون اشتراك نشط</span>
                          )}
                        </div>
                        {studentDetail.subscription && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            ينتهي في: {formatDate(studentDetail.subscription.endDate)}
                          </div>
                        )}
                      </div>
                      {studentDetail.subscription && (
                        <button 
                          className={studentDetail.subscription.isFrozen ? "btn-primary" : "btn-danger"}
                          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                          onClick={() => handleFreeze(studentDetail.id, !studentDetail.subscription?.isFrozen)}
                        >
                          {studentDetail.subscription.isFrozen ? 'تفعيل (إلغاء التجميد)' : 'تجميد الاشتراك'}
                        </button>
                      )}
                    </div>

                    {/* Checklist of Subjects */}
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>المواد الدراسية المفعلة للطالب</label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                        حدد المواد التي ترغب في تفعيلها للطالب. سيتم سحب المواد غير المحددة فور الحفظ.
                      </p>
                      
                      <div style={{
                        maxHeight: '180px',
                        overflowY: 'auto',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        gap: '0.5rem',
                        background: '#f8fafc'
                      }} className="form-grid-2">
                        {subjects
                          .filter((s) => s.grade === profileStudent.grade && s.branch === profileStudent.branch)
                          .map((sub) => {
                            const isChecked = selectedSubjectIds.includes(sub.id);
                            return (
                              <label key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500, background: '#ffffff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <input
                                  type="checkbox"
                                  style={{ width: 'auto' }}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedSubjectIds([...selectedSubjectIds, sub.id]);
                                    } else {
                                      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== sub.id));
                                    }
                                  }}
                                />
                                <span>{sub.name}</span>
                              </label>
                            );
                          })}
                        {subjects.filter((s) => s.grade === profileStudent.grade && s.branch === profileStudent.branch).length === 0 && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', gridColumn: 'span 2', textAlign: 'center' }}>لا توجد مواد مضافة لهذا الصف والتخصص.</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                      <button
                        className="btn-primary"
                        onClick={submitGrant}
                        style={{ flex: 1 }}
                      >
                        حفظ المواد الدراسية
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setProfileStudent(null)}
                        style={{ flex: 1 }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>فشل تحميل الاشتراك.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
