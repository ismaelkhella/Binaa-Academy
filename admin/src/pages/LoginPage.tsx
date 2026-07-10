import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@bina.ps');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    loading || setLoading(true);
    try {
      const { token } = await api.login(email, password);
      localStorage.setItem('admin_token', token);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول. يرجى التحقق من المدخلات.');
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>أكاديمية بناء</h1>
        <p className="subtitle">لوحة التحكم — تسجيل الدخول</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@bina.ps"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.75rem', padding: '0.7rem' }} disabled={loading}>
            {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
