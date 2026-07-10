import { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  target: string;
  createdAt: string;
}

const targetLabels: Record<string, string> = {
  ALL: 'جميع الطلاب',
  G11_SCI: 'الصف الحادي عشر — علمي',
  G11_LIT: 'الصف الحادي عشر — أدبي',
  G12_SCI: 'الصف الثاني عشر — علمي',
  G12_LIT: 'الصف الثاني عشر — أدبي',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('ALL');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bina_notifications');
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        // Fallback to default mock notifications if parse fails
        initializeDefaultNotifications();
      }
    } else {
      initializeDefaultNotifications();
    }
  }, []);

  function initializeDefaultNotifications() {
    const defaults: NotificationItem[] = [
      {
        id: '1',
        title: 'مرحباً بكم في أكاديمية بناء التعليمية!',
        message: 'يسعدنا انضمامكم إلينا. تم تفعيل حسابك بنجاح، يمكنك الآن البدء بحضور الحصص وحل الكويزات لضمان تحقيق التفوق.',
        target: 'ALL',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        title: 'تحديث مادة الفيزياء للتوجيهي العلمي',
        message: 'تم إضافة فيديوهات جديدة لشرح وحدة الكهرومغناطيسية وتحديث الأسئلة المقترحة للامتحان النهائي. تفقد قسم الدروس والمحتوى الآن.',
        target: 'G12_SCI',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    setNotifications(defaults);
    localStorage.setItem('bina_notifications', JSON.stringify(defaults));
  }

  function saveNotifications(items: NotificationItem[]) {
    setNotifications(items);
    localStorage.setItem('bina_notifications', JSON.stringify(items));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !message) {
      alert('الرجاء كتابة العنوان وتفاصيل الرسالة.');
      return;
    }

    setSending(true);
    setSuccess('');

    // Simulate sending progress
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      title,
      message,
      target,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    saveNotifications(updated);
    
    // Clear form and show success banner
    setTitle('');
    setMessage('');
    setTarget('ALL');
    setSending(false);
    setSuccess('تم إرسال وبث التنبيه للطلاب بنجاح!');
    setTimeout(() => setSuccess(''), 4000);
  }

  function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا التنبيه من السجل التاريخي؟ لن يؤثر الحذف على الهواتف التي استلمته بالفعل.')) return;
    const filtered = notifications.filter((n) => n.id !== id);
    saveNotifications(filtered);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h1>بث التنبيهات والإعلانات</h1>
          <p>أرسل إشعارات فورية وإعلانات عامة لجميع الطلاب أو لصفوف وتخصصات محددة.</p>
        </div>
      </div>

      {success && (
        <div style={{
          background: 'var(--success-bg)',
          color: 'var(--success-text)',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          fontWeight: 600,
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: 'var(--shadow)'
        }}>
          ✨ {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Send Notification Form Container */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            إنشاء وبث تنبيه جديد
          </h3>

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>عنوان الرسالة / الإعلان</label>
              <input
                type="text"
                placeholder="أدخل عنواناً واضحاً وجذاباً..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>الفئة المستهدفة (الطلاب)</label>
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="ALL">جميع الطلاب في المنصة</option>
                <option value="G11_SCI">طلاب الصف الحادي عشر — علمي</option>
                <option value="G11_LIT">طلاب الصف الحادي عشر — أدبي</option>
                <option value="G12_SCI">طلاب الصف الثاني عشر (توجيهي) — علمي</option>
                <option value="G12_LIT">طلاب الصف الثاني عشر (توجيهي) — أدبي</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>مضمون الرسالة</label>
              <textarea
                rows={5}
                placeholder="اكتب تفاصيل التنبيه أو الإعلان هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={sending}
              style={{ padding: '0.75rem', width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {sending ? 'جاري بث التنبيه للطلاب...' : '🚀 إرسال وبث التنبيه فوراً'}
            </button>
          </form>
        </div>

        {/* History of Sent Notifications */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
            سجل التنبيهات المرسلة
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
            قائمة بالإعلانات والتنبيهات السابقة التي تم إرسالها للطلاب من خلال لوحة التحكم.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '480px', overflowY: 'auto', paddingLeft: '0.25rem' }}>
            {notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '1rem',
                  background: '#f8fafc',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
              >
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    right: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    fontSize: '0.9rem',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                  title="حذف من السجل"
                >
                  🗑️
                </button>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', paddingLeft: '1.5rem' }}>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}>
                    {targetLabels[item.target] || item.target}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    📅 {new Date(item.createdAt).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '0.25rem' }}>
                  {item.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {item.message}
                </p>
              </div>
            ))}

            {notifications.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
                لا يوجد أي تنبيهات مرسلة حالياً.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
