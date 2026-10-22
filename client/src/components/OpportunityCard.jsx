import { Link } from 'react-router-dom';

export default function OpportunityCard({ opportunity }) {
  const { _id, title, company, domain, location, experience } = opportunity;
  return (
    <article className="card">
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        <span className="badge">{domain}</span>
      </div>
      <p className="card-company">{company}</p>
      <div className="card-meta">
        <span>📍 {location}</span>
        <span>💼 {experience}</span>
      </div>
      <Link to={`/opportunities/${_id}`} className="btn btn-primary card-btn">
        View Details
      </Link>
    </article>
  );
}
