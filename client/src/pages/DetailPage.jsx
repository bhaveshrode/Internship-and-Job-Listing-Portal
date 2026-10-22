import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function DetailPage() {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getOpportunity(id)
      .then(setOpportunity)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="status-message error">⚠️ {error}</p>;
  if (!opportunity) return <p className="status-message">Loading...</p>;

  return (
    <section className="detail-page">
      <Link to="/" className="back-link">
        ← Back to listings
      </Link>
      <div className="detail-header">
        <div>
          <h1>{opportunity.title}</h1>
          <p className="card-company">{opportunity.company}</p>
        </div>
        <span className="badge">{opportunity.domain}</span>
      </div>
      <div className="detail-meta">
        <span>📍 {opportunity.location}</span>
        <span>💼 {opportunity.experience}</span>
      </div>
      <div className="detail-description">
        <h2>Description</h2>
        <p>{opportunity.description}</p>
      </div>
      <div className="detail-actions">
        <Link to={`/opportunities/${opportunity._id}/apply`} className="btn btn-primary">
          Apply Now
        </Link>
        {opportunity.applicationLink && (
          <a
            href={opportunity.applicationLink}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            Apply on Company Site ↗
          </a>
        )}
      </div>
    </section>
  );
}
