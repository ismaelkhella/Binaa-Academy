import { useEffect, useState } from 'react';
import { api, Teacher, TeachersDashboardData } from '../api/client';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dashboardData, setDashboardData] = useState<TeachersDashboardData | null>(null);
  
  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 10;

  // Add Teacher Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    bio: '',
    avatarUrl: '',
    commissionRate: 0.25,
    subjectId: '',
  });

  // Credentials modal (set/reset teacher login)
  const [credTeacher, setCredTeacher] = useState<Teacher | null>(null);
  const [credForm, setCredForm] = useState({ phone: '', password: '' });
  const [credError, setCredError] = useState<string | null>(null);
  const [credSuccess, setCredSuccess] = useState<string | null>(null);
  const [credSubmitting, setCredSubmitting] = useState(false);

  async function handleCredSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!credTeacher) return;
    if (!credForm.phone.trim() && !credForm.password.trim()) {
      setCredError('أدخل رقم هاتف جديد أو كلمة مرور جديدة');
      return;
    }
    setCredSubmitting(true);
    setCredError(null);
    setCredSuccess(null);
    try {
      await api.updateTeacherCredentials(credTeacher.id, {
        phone: credForm.phone.trim() || undefined,
        password: credForm.password.trim() || undefined,
      });
      setCredSuccess('تم تحديث بيانات الدخول بنجاح');
      api.getTeachers({ page: page.toString(), limit: limit.toString() }).then((res) => {
        setTeachers(res.teachers);
        setTotal(res.total);
      });
      setTimeout(() => {
        setCredTeacher(null);
        setCredForm({ phone: '', password: '' });
        setCredSuccess(null);
      }, 1200);
    } catch (err: any) {
      setCredError(err.message || 'حدث خطأ');
    } finally {
      setCredSubmitting(false);
    }
  }
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch subjects for selection list
  useEffect(() => {
    api.getSubjects()
      .then((data) => setAllSubjects(data))
      .catch((err) => console.error('Error fetching subjects:', err));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError(null);

    try {
      const res = await api.uploadFile(file);
      setFormData((prev) => ({ ...prev, avatarUrl: res.url }));
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'فشل رفع الصورة');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setFormError('الاسم ورقم الهاتف مطلوبان');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await api.createTeacher({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        password: formData.password.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        avatarUrl: formData.avatarUrl.trim() || undefined,
        commissionRate: Number(formData.commissionRate),
        subjectId: formData.subjectId || undefined,
      });

      setFormSuccess('تم إضافة المعلم بنجاح!');
      setFormData({
        name: '',
        phone: '',
        password: '',
        bio: '',
        avatarUrl: '',
        commissionRate: 0.25,
        subjectId: '',
      });
      setPage(1);

      // Refresh teachers list
      api.getTeachers({ page: '1', limit: limit.toString() })
        .then((res) => {
          setTeachers(res.teachers);
          setTotal(res.total);
        });

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'حدث خطأ أثناء إضافة المعلم');
    } finally {
      setSubmitting(false);
    }
  }

  // Load Dashboard Data (Stats, Applications, Top Teachers)
  useEffect(() => {
    api.getTeachersDashboard()
      .then((data) => setDashboardData(data))
      .catch((err) => console.error('Error fetching dashboard stats:', err));
  }, []);

  // Load Teachers List with Search and Pagination
  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };
    if (search) params.search = search;

    api.getTeachers(params)
      .then((res) => {
        let list = res.teachers;
        if (gradeFilter) {
          list = list.filter((t) => t.grade === gradeFilter);
        }
        setTeachers(list);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching teachers:', err);
        setError('تعذر تحميل بيانات المعلمين. يرجى المحاولة مرة أخرى.');
      })
      .finally(() => setLoading(false));
  }, [search, gradeFilter, page]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1); // Reset to page 1 on new search
  }

  function handleGradeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setGradeFilter(e.target.value);
    setPage(1);
  }

  function renderStars(rating: number = 5.0) {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<span key={i} style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>);
      } else {
        stars.push(<span key={i} style={{ color: '#cbd5e1', fontSize: '1rem' }}>★</span>);
      }
    }
    return <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>{stars}</div>;
  }

  function handleAddTeacher() {
    setIsModalOpen(true);
  }

  return (
    <div style={{ direction: 'rtl' }}>
      {/* Upper header action row */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>إدارة شؤون المعلمين</h1>
          <p>مراجعة أداء المعلمين، الجداول الدراسية، والطلبات الجديدة.</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#047857', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleAddTeacher}>
            <span>➕</span> إضافة معلم
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>👥</span>
            <span className="trend-badge up">▲ +12%</span>
          </div>
          <div className="label">إجمالي المعلمين</div>
          <div className="value">{dashboardData?.stats.totalTeachers || 142}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon" style={{ background: '#ecfdf5', color: '#047857' }}>📖</span>
            <span className="trend-badge neutral">أسبوعياً</span>
          </div>
          <div className="label">الحصص النشطة</div>
          <div className="value">{dashboardData?.stats.activeClasses || 56}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon" style={{ background: '#fffbeb', color: '#b45309' }}>★</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مستهدف 5.0</span>
          </div>
          <div className="label">تقييم الأداء</div>
          <div className="value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {dashboardData?.stats.performanceRating || 4.8}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ ٥.٠</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-icon" style={{ background: '#fdf2f8', color: '#be185d' }}>⏱️</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي</span>
          </div>
          <div className="label">ساعات المحتوى</div>
          <div className="value" style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {dashboardData?.stats.contentHours || 840}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>ساعة</span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid-3">
        {/* Right Directory Table (2/3 width) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>دليل المعلمين</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select 
                value={gradeFilter} 
                onChange={handleGradeChange}
                style={{ width: '130px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              >
                <option value="">الكل</option>
                <option value="العاشر">العاشر</option>
                <option value="الحادي عشر">الحادي عشر</option>
                <option value="الثاني عشر">الثاني عشر</option>
              </select>
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                value={search}
                onChange={handleSearchChange}
                style={{ width: '200px', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              جاري تحميل قائمة المعلمين...
            </div>
          ) : error ? (
            <div className="error-msg">{error}</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'right' }}>المعلم</th>
                    <th style={{ textAlign: 'right' }}>المادة الدراسية</th>
                    <th style={{ textAlign: 'right' }}>المرحلة الدراسية</th>
                    <th style={{ textAlign: 'center' }}>عدد المشتركين</th>
                    <th style={{ textAlign: 'center' }}>التقييم</th>
                    <th style={{ textAlign: 'center' }}>بيانات الدخول</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img 
                            src={teacher.avatar || '/avatar-placeholder.svg'} 
                            alt={teacher.name} 
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{teacher.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{teacher.user?.phone || '0599000000'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{teacher.specialty}</td>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{teacher.grade}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.85rem' }}>{teacher.lessons || 0} طالب</td>
                      <td style={{ textAlign: 'center' }}>{renderStars(teacher.rating)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => { setCredTeacher(teacher); setCredForm({ phone: teacher.user?.phone || '', password: '' }); setCredError(null); }}
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          🔑 تعديل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderTop: '1px solid var(--border)', 
            paddingTop: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              عرض {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} من أصل {total} معلم
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ‹
              </button>
              {[1, 2, 3].map((pNum) => (
                <button
                  key={pNum}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    border: '1px solid var(--border)',
                    background: page === pNum ? '#0f172a' : '#ffffff',
                    color: page === pNum ? '#ffffff' : '#0f172a',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button 
                className="btn-secondary" 
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                disabled={page * limit >= total}
                onClick={() => setPage(p => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Left column (Top Teachers) */}
        <div className="grid-right">

          {/* Top Teachers Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>🏆</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>المعلمون المتميزون</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dashboardData?.topTeachers.map((top, index) => (
                <div 
                  key={top.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: index === 2 ? 'none' : '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={top.avatar} 
                        alt={top.name} 
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ 
                        position: 'absolute', 
                        bottom: '-4px', 
                        left: '-4px', 
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : '#d97706',
                        color: index === 0 ? '#000' : '#fff',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 900
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{top.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>نسبة رضا الطلاب: {top.satisfactionRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '2rem',
          right: 'auto',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#047857',
          color: '#ffffff',
          fontSize: '1.8rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          zIndex: 99
        }}
        onClick={handleAddTeacher}
      >
        +
      </button>

      {/* Add Teacher Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '500px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>إضافة معلم جديد</h3>
              <button 
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => {
                  setIsModalOpen(false);
                  setFormError(null);
                  setFormSuccess(null);
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #fee2e2' }}>
                ⚠️ {formError}
              </div>
            )}

            {formSuccess && (
              <div style={{ background: '#ecfdf5', color: '#047857', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid #d1fae5' }}>
                ✓ {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Avatar Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                  <img 
                    src={formData.avatarUrl || '/avatar-placeholder.svg'} 
                    alt="معاينة" 
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }}
                  />
                  {uploadingImage && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      color: '#047857'
                    }}>
                      جاري...
                    </div>
                  )}
                </div>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#047857',
                  cursor: 'pointer',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe'
                }}>
                  تحميل صورة المعلم
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>الاسم الكامل *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: أ. أحمد علي"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>رقم الهاتف *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="مثال: 0599000000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>كلمة مرور الدخول للتطبيق</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="6 أحرف على الأقل — يستخدمها المعلم لتسجيل الدخول"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>نسبة العمولة</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="مثال: 0.25"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>السيرة الذاتية</label>
                <textarea 
                  placeholder="نبذة بسيطة عن خبرات المعلم..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '60px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>المادة التي يدرسها المعلم</label>
                <select 
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}
                >
                  <option value="">اختر المادة الدراسية...</option>
                  {allSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} - {subject.grade === 'GRADE_12' ? 'الثاني عشر' : 'الحادي عشر'} ({subject.branch === 'SCIENTIFIC' ? 'علمي' : 'أدبي'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ 
                    background: '#047857', 
                    color: '#ffffff', 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '8px', 
                    border: 'none', 
                    fontWeight: 700, 
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ المعلم'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  style={{ 
                    background: '#f1f5f9', 
                    color: '#475569', 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher credentials modal */}
      {credTeacher && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '1rem' }} onClick={() => setCredTeacher(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '420px', direction: 'rtl' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem' }}>بيانات دخول المعلم</h3>
            <p style={{ margin: '0 0 1rem', color: '#64748b', fontSize: '0.85rem' }}>{credTeacher.name} — يسجّل الدخول للتطبيق برقم الهاتف وكلمة المرور</p>

            {credError && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{credError}</div>}
            {credSuccess && <div style={{ background: '#ecfdf5', color: '#047857', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem' }}>{credSuccess}</div>}

            <form onSubmit={handleCredSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>رقم الهاتف</label>
                <input
                  type="tel"
                  placeholder="05XXXXXXXX"
                  value={credForm.phone}
                  onChange={(e) => setCredForm({ ...credForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>كلمة مرور جديدة</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="اتركها فارغة للإبقاء على الحالية"
                  value={credForm.password}
                  onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-start', marginTop: '0.25rem' }}>
                <button type="submit" disabled={credSubmitting} style={{ background: '#047857', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  {credSubmitting ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setCredTeacher(null)} style={{ background: '#f1f5f9', color: '#475569', padding: '0.6rem 1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
