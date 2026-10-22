import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        📋 JobPortal
      </Link>
      <nav className="navbar-links">
        <Link to="/">Opportunities</Link>
        <Link to="/admin/login" className="btn btn-outline">
          Admin
        </Link>
      </nav>
    </header>
  );
}
