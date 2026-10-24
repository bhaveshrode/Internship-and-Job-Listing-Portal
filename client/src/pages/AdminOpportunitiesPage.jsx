import { useEffect, useState } from 'react';
import { api } from '../api/client';

const EMPTY = {
  title: '',
  company: '',
  domain: '',
  location: '',
  experience: '',
  description: '',
  applicationLink: '',
};

export default function AdminOpportunitiesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null = add mode, id = edit mode
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getOpportunities({ limit: 50 });
      setItems(data.items);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setNotice('');
    setShowForm(true);
  };

  const openEdit = (op) => {
    setEditing(op._id);
    setForm({
      title: op.title,
      company: op.company,
      domain: op.domain,
      location: op.location,
      experience: op.experience,
      description: op.description,
      applicationLink: op.applicationLink || '',
    });
    setNotice('');
    setShowForm(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.updateOpportunity(editing, form);
        setNotice(`✅ Updated "${form.title}"`);
      } else {
        await api.createOpportunity(form);
        setNotice(`✅ Added "${form.title}"`);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (op) => {
    if (!window.confirm(`Delete "${op.title}" at ${op.company}? This cannot be undone.`)) {
      return;
    }
    setError('');
    try {
      await api.deleteOpportunity(op._id);
      setNotice(`🗑️ Deleted "${op.title}"`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Opportunities</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Opportunity
          </button>
        )}
      </div>

      {notice && <p className="notice">{notice}</p>}
      {error && <p className="status-message error">⚠️ {error}</p>}

      {showForm && (
        <form className="opportunity-form" onSubmit={handleSubmit}>
          <h2>{editing ? 'Edit Opportunity' : 'Add Opportunity'}</h2>
          <div className="form-grid">
            <label>
              Title *
              <input
                className="input"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Company *
              <input
                className="input"
                name="company"
                value={form.company}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Domain *
              <input
                className="input"
                name="domain"
                value={form.domain}
                onChange={handleChange}
                placeholder="e.g. Web Development"
                list="domain-suggestions"
                required
              />
            </label>
            <label>
              Location *
              <input
                className="input"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Remote"
                required
              />
            </label>
            <label>
              Experience *
              <input
                className="input"
                name="experience"
                value={form.experience}
                onChange={handleChange}
                placeholder="e.g. Fresher"
                required
              />
            </label>
            <label>
              Application Link
              <input
                className="input"
                name="applicationLink"
                type="url"
                value={form.applicationLink}
                onChange={handleChange}
                placeholder="https://..."
              />
            </label>
          </div>
          <label className="form-full">
            Description *
            <textarea
              className="input"
              name="description"
              rows="5"
              value={form.description}
              onChange={handleChange}
              required
            />
          </label>
          <datalist id="domain-suggestions">
            <option value="Web Development" />
            <option value="Data Science" />
            <option value="Marketing" />
            <option value="Design" />
          </datalist>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Opportunity'}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="status-message">Loading...</p>
      ) : items.length === 0 ? (
        <p className="status-message">No opportunities yet. Add the first one!</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Domain</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((op) => (
              <tr key={op._id}>
                <td>{op.title}</td>
                <td>{op.company}</td>
                <td>{op.domain}</td>
                <td>{op.location}</td>
                <td className="row-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(op)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(op)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
