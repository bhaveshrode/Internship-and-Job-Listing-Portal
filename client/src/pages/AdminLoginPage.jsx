import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../api/client';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const alreadyAuthed = Boolean(getToken());

  // Already logged in? Go straight to the dashboard (in an effect, not during render).
  useEffect(() => {
    if (alreadyAuthed) navigate('/admin/opportunities', { replace: true });
  }, [alreadyAuthed, navigate]);

  if (alreadyAuthed) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { token } = await api.loginAdmin(form);
      localStorage.setItem('adminToken', token);
      navigate('/admin/opportunities', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-login">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        {error && <p className="status-message error">⚠️ {error}</p>}
        <label>
          Username
          <input
            className="input"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </section>
  );
}
