import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getToken, logout } from '../api/client';

export default function AdminLayout() {
  const navigate = useNavigate();
  const authed = Boolean(getToken());

  useEffect(() => {
    if (!authed) navigate('/admin/login', { replace: true });
  }, [authed, navigate]);

  if (!authed) return null;

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <section className="admin-layout">
      <div className="admin-topbar">
        <div className="admin-tabs">
          <NavLink to="/admin/opportunities">Manage Opportunities</NavLink>
          <NavLink to="/admin/applications">Applications</NavLink>
        </div>
        <div className="admin-actions">
          <Link to="/" className="btn btn-outline">
            View Site
          </Link>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
      <Outlet />
    </section>
  );
}
