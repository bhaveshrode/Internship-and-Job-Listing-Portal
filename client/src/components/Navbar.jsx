import { Link } from 'react-router-dom';
import { getToken } from '../api/client';

export default function Navbar() {
  const adminHome = getToken() ? '/admin/opportunities' : '/admin/login';
  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        📋 JobPortal
      </Link>
      <nav className="navbar-links">
        <Link to="/">Opportunities</Link>
        <Link to={adminHome} className="btn btn-outline">
          Admin
        </Link>
      </nav>
    </header>
  );
}
