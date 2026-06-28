import { useEffect, useState } from 'react';
import { api, Plan } from '../api/client';
import { planLabel } from '../utils/labels';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ priceIls: 0, videosPerSubject: 0, discountPercent: 0 });

  useEffect(() => {
    api.getPlans().then(setPlans).catch((e) => setError(e.message));
  }, []);

  async function savePlan(id: string) {
    await api.updatePlan(id, editForm);
    setEditing(null);
    const updated = await api.getPlans();
    setPlans(updated);
  }

  return (
    <>
      <div className="page-header">
        <h1>إدارة الاشتراكات</h1>
        <p>خطط الاشتراك والأسعار</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="stats-grid">
        {plans.map((plan) => (
          <div className="card" key={plan.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>{plan.nameAr}</h3>
              <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-muted'}`}>
                {plan.isActive ? 'فعّال' : 'معطّل'}
              </span>
            </div>

            {editing === plan.id ? (
              <div>
                <div className="form-group">
                  <label>السعر (₪)</label>
                  <input type="number" value={editForm.priceIls} onChange={(e) => setEditForm({ ...editForm, priceIls: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label>فيديوهات / مادة</label>
                  <input type="number" value={editForm.videosPerSubject} onChange={(e) => setEditForm({ ...editForm, videosPerSubject: +e.target.value })} />
                </div>
                <div className="form-group">
                  <label>نسبة الخصم %</label>
                  <input type="number" value={editForm.discountPercent} onChange={(e) => setEditForm({ ...editForm, discountPercent: +e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-primary" onClick={() => savePlan(plan.id)}>حفظ</button>
                  <button className="btn-secondary" onClick={() => setEditing(null)}>إلغاء</button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{planLabel(plan.type)} — {plan.durationDays} يوم</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                  {plan.priceIls === 0 ? 'مجاني' : `₪${plan.priceIls}`}
                </p>
                {plan.discountPercent > 0 && (
                  <p style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>خصم {plan.discountPercent}%</p>
                )}
                <p style={{ marginTop: '0.5rem' }}>{plan.videosPerSubject} فيديو / مادة</p>
                <button
                  className="btn-secondary"
                  style={{ marginTop: '1rem', width: '100%' }}
                  onClick={() => {
                    setEditing(plan.id);
                    setEditForm({
                      priceIls: plan.priceIls,
                      videosPerSubject: plan.videosPerSubject,
                      discountPercent: plan.discountPercent,
                    });
                  }}
                >
                  تعديل
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
