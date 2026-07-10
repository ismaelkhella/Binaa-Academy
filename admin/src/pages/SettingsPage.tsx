import { useEffect, useState } from 'react';
import { api, Plan } from '../api/client';
import { planLabel } from '../utils/labels';

export default function SettingsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state for plans
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editVideosPerSubject, setEditVideosPerSubject] = useState(10);
  const [editIsActive, setEditIsActive] = useState(true);

  function load() {
    setLoading(true);
    setError('');
    api.getPlans()
      .then((data) => setPlans(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSavePlan() {
    if (!editingPlan) return;
    try {
      await api.updatePlan(editingPlan.id, {
        priceIls: editPrice,
        discountPercent: editDiscount,
        videosPerSubject: editVideosPerSubject,
        isActive: editIsActive,
      });
      setSuccess('تم حفظ إعدادات الباقة بنجاح');
      setEditingPlan(null);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'حدث خطأ أثناء تعديل الباقة');
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>إعدادات النظام</h1>
          <p>إدارة باقات الاشتراك والأسعار وقوانين المشاهدة الافتراضية لمنصة أكاديمية بناء.</p>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Subscription Plans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              باقات خطط الاشتراك
            </h3>
            {loading ? (
              <p style={{ color: 'var(--text-muted)' }}>جاري تحميل الباقات...</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right' }}>الباقة</th>
                      <th style={{ textAlign: 'right' }}>النوع</th>
                      <th style={{ textAlign: 'right' }}>المدة (أيام)</th>
                      <th style={{ textAlign: 'right' }}>السعر</th>
                      <th style={{ textAlign: 'right' }}>خصم (%)</th>
                      <th style={{ textAlign: 'right' }}>فيديوهات لكل مادة</th>
                      <th style={{ textAlign: 'right' }}>الحالة</th>
                      <th style={{ textAlign: 'right' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.nameAr}</td>
                        <td>{planLabel(p.type)}</td>
                        <td>{p.durationDays} يوم</td>
                        <td style={{ fontWeight: 600 }}>{p.priceIls} ₪</td>
                        <td>%{p.discountPercent}</td>
                        <td>{p.videosPerSubject} فيديوهات</td>
                        <td>
                          <span className={`badge ${p.isActive ? 'badge-success' : 'badge-muted'}`}>
                            {p.isActive ? 'نشطة' : 'معطلة'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setEditingPlan(p);
                              setEditPrice(p.priceIls);
                              setEditDiscount(p.discountPercent);
                              setEditVideosPerSubject(p.videosPerSubject);
                              setEditIsActive(p.isActive);
                            }}
                          >
                            تعديل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - General System Configs Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ background: '#f8fafc' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>معلومات النظام</h3>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <div>
                <strong>مزود قاعدة البيانات:</strong> SQLite (تطوير نشط)
              </div>
              <div>
                <strong>رابط خادم الـ API:</strong> <code style={{ direction: 'ltr', background: '#e2e8f0', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>http://localhost:3000/api</code>
              </div>
              <div>
                <strong>نظام المصادقة:</strong> JWT tokens (ثلاثين يوماً للمستخدمين، سبعة أيام للمدراء)
              </div>
              <div>
                <strong>مدة صلاحية الـ OTP:</strong> 5 دقائق
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>لتعديل الإعدادات البرمجية الأساسية (مثل مفاتيح الأمان أو البورت)، يرجى تعديل ملف التكوين المحلي البيئي <code style={{ background: '#e2e8f0', padding: '0.1rem 0.2rem', borderRadius: '4px' }}>api/.env</code>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
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
              تعديل باقة: {editingPlan.nameAr}
            </h3>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>سعر الباقة (₪)</label>
              <input
                type="number"
                value={editPrice}
                onChange={(e) => setEditPrice(Math.max(0, +e.target.value))}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>نسبة الخصم (%)</label>
              <input
                type="number"
                value={editDiscount}
                onChange={(e) => setEditDiscount(Math.max(0, Math.min(100, +e.target.value)))}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>الفيديوهات المتاحة لكل مادة</label>
              <input
                type="number"
                value={editVideosPerSubject}
                onChange={(e) => setEditVideosPerSubject(Math.max(1, +e.target.value))}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
                id="editIsActiveCheckbox"
              />
              <label htmlFor="editIsActiveCheckbox" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>تفعيل الباقة في النظام</label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn-primary"
                onClick={handleSavePlan}
                style={{ flex: 1 }}
              >
                حفظ التعديلات
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditingPlan(null)}
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
