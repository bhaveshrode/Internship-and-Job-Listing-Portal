import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function ApplyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', coverNote: '' });
  const [status, setStatus] = useState('idle'); // idle | submitting | error | success
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      await api.createApplication({ opportunityId: id, ...form });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  if (status === 'success') {
    return (
      <section className="apply-page confirmation">
        <div className="confirmation-card">
          <span className="confirmation-icon">✅</span>
          <h1>Application Submitted!</h1>
          <p>Thank you, {form.name}. Your application has been received.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Opportunities
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="apply-page">
      <Link to={`/opportunities/${id}`} className="back-link">
        ← Back to details
      </Link>
      <h1>Submit Your Application</h1>
      {error && <p className="status-message error">⚠️ {error}</p>}
      <form className="apply-form" onSubmit={handleSubmit}>
        <label>
          Full Name *
          <input
            className="input"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Email *
          <input
            className="input"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Phone *
          <input
            className="input"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Cover Note
          <textarea
            className="input"
            name="coverNote"
            rows="5"
            value={form.coverNote}
            onChange={handleChange}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </section>
  );
}
