import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getApplications()
      .then(setApplications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status-message">Loading applications...</p>;
  if (error) return <p className="status-message error">⚠️ {error}</p>;

  if (applications.length === 0) {
    return (
      <div className="admin-page">
        <h1>Applications</h1>
        <p className="status-message">No applications yet.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Applications ({applications.length})</h1>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Contact</th>
            <th>Opportunity</th>
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app._id}>
              <td>
                <strong>{app.name}</strong>
                {app.coverNote && (
                  <details className="cover-note">
                    <summary>Cover note</summary>
                    <p>{app.coverNote}</p>
                  </details>
                )}
              </td>
              <td>
                <div>{app.email}</div>
                <div className="muted">{app.phone}</div>
              </td>
              <td>
                {app.opportunity ? (
                  <>
                    <div>{app.opportunity.title}</div>
                    <div className="muted">{app.opportunity.company}</div>
                  </>
                ) : (
                  <span className="muted">Deleted opportunity</span>
                )}
              </td>
              <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
