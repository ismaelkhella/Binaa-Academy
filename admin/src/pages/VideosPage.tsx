import { useEffect, useState, FormEvent } from 'react';
import { api, Video, Subject } from '../api/client';
import { gradeLabel, branchLabel, formatDuration } from '../utils/labels';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ subjectId: '', title: '', description: '', streamUrl: '' });

  function load() {
    Promise.all([api.getVideos(), api.getSubjects()])
      .then(([v, s]) => { setVideos(v); setSubjects(s); })
      .catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await api.createVideo({ ...form, status: 'PUBLISHED' });
    setShowForm(false);
    setForm({ subjectId: '', title: '', description: '', streamUrl: '' });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا الفيديو؟')) return;
    await api.deleteVideo(id);
    load();
  }

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>إدارة المحتوى</h1>
          <p>الفيديوهات والمواد الدراسية</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '+ فيديو جديد'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>إضافة فيديو</h3>
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <div className="form-group">
                <label>المادة</label>
                <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
                  <option value="">اختر المادة</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {gradeLabel(s.grade)} — {branchLabel(s.branch)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>العنوان</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>الوصف</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="form-group">
              <label>رابط البث (HLS)</label>
              <input value={form.streamUrl} onChange={(e) => setForm({ ...form, streamUrl: e.target.value })} dir="ltr" placeholder="https://..." />
            </div>
            <button type="submit" className="btn-primary">حفظ</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>العنوان</th>
                <th>المادة</th>
                <th>المعلم</th>
                <th>المدة</th>
                <th>الحالة</th>
                <th>المشاهدات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id}>
                  <td>{v.title}</td>
                  <td>{v.subject.name} ({gradeLabel(v.subject.grade)})</td>
                  <td>{v.teacher?.name ?? '—'}</td>
                  <td>{formatDuration(v.durationSec)}</td>
                  <td>
                    <span className={`badge ${v.status === 'PUBLISHED' ? 'badge-success' : 'badge-muted'}`}>
                      {v.status === 'PUBLISHED' ? 'منشور' : v.status}
                    </span>
                  </td>
                  <td>{v._count.videoViews}</td>
                  <td>
                    <button className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(v.id)}>
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد فيديوهات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
