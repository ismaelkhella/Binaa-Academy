import { useEffect, useState } from 'react';
import { api, CommunityMessage } from '../api/client';

const API_BASE = '/api';

export default function CommunityPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.getSubjects()
      .then((data: any[]) => setSubjects(data))
      .catch(() => setError('تعذر تحميل المواد'));
  }, []);

  function loadMessages(subjectId: string) {
    if (!subjectId) { setMessages([]); return; }
    setLoading(true);
    setError(null);
    api.getCommunityMessages(subjectId)
      .then((msgs) => setMessages(msgs))
      .catch(() => setError('تعذر تحميل الرسائل'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadMessages(selectedSubject); }, [selectedSubject]);

  async function handleDelete(id: string) {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;
    setDeleting(id);
    try {
      await api.deleteCommunityMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setError('تعذر حذف الرسالة');
    } finally {
      setDeleting(null);
    }
  }

  function attachmentUrl(m: CommunityMessage) {
    if (!m.attachment) return '';
    const token = localStorage.getItem('admin_token');
    return `${API_BASE}/admin/community/attachments/${m.attachment.id}${token ? '' : ''}`;
  }

  async function openAttachment(m: CommunityMessage) {
    if (!m.attachment) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(attachmentUrl(m), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      setError('تعذر فتح المرفق');
    }
  }

  function typeBadge(type: string) {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      text: { label: 'نص', bg: '#f1f5f9', color: '#475569' },
      image: { label: 'صورة', bg: '#eff6ff', color: '#1d4ed8' },
      voice: { label: 'صوت', bg: '#fdf4ff', color: '#a21caf' },
      file: { label: 'ملف', bg: '#fffbeb', color: '#b45309' },
    };
    const b = map[type] || map.text;
    return <span style={{ background: b.bg, color: b.color, padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>{b.label}</span>;
  }

  return (
    <div style={{ direction: 'rtl' }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1>مجتمعات المواد</h1>
          <p>مراقبة رسائل المجتمع لكل مادة وحذف الرسائل المخالفة.</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155' }}>المادة:</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minWidth: '220px' }}
        >
          <option value="">اختر مادة...</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.grade === 'ELEVENTH' ? 'الحادي عشر' : 'الثاني عشر'}</option>
          ))}
        </select>
        {selectedSubject && (
          <button onClick={() => loadMessages(selectedSubject)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            🔄 تحديث
          </button>
        )}
      </div>

      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.6rem 1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ background: '#fff', borderRadius: '12px', padding: '1rem' }}>
        {!selectedSubject ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>اختر مادة لعرض رسائل مجتمعها</p>
        ) : loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>جارٍ التحميل...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>لا توجد رسائل في هذا المجتمع بعد</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <img src={m.sender.avatarUrl || '/avatar-placeholder.svg'} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{m.sender.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: m.sender.role === 'TEACHER' ? '#047857' : '#64748b', fontWeight: 700 }}>
                      {m.sender.role === 'TEACHER' ? 'معلم' : 'طالب'}
                    </span>
                    {typeBadge(m.type)}
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{new Date(m.createdAt).toLocaleString('ar')}</span>
                  </div>
                  {m.content && <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</p>}
                  {m.attachment && (
                    <button onClick={() => openAttachment(m)} style={{ marginTop: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      📎 {m.attachment.fileName} ({Math.round(m.attachment.size / 1024)} كيلوبايت)
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  title="حذف الرسالة"
                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  {deleting === m.id ? '...' : '🗑 حذف'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
