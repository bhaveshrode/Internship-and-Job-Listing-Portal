import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import ListingPage from './pages/ListingPage';
import DetailPage from './pages/DetailPage';
import ApplyPage from './pages/ApplyPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminOpportunitiesPage from './pages/AdminOpportunitiesPage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import { getToken } from './api/client';

const RequireAuth = ({ children }) => (getToken() ? children : <Navigate to="/admin/login" replace />);

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<ListingPage />} />
          <Route path="/opportunities/:id" element={<DetailPage />} />
          <Route path="/opportunities/:id/apply" element={<ApplyPage />} />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="/admin/opportunities" replace />} />
            <Route path="opportunities" element={<AdminOpportunitiesPage />} />
            <Route path="applications" element={<AdminApplicationsPage />} />
          </Route>

          <Route path="*" element={<p className="status-message">Page not found.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
