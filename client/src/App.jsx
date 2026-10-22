import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ListingPage from './pages/ListingPage';
import DetailPage from './pages/DetailPage';
import ApplyPage from './pages/ApplyPage';
import AdminLoginPage from './pages/AdminLoginPage';

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
        </Routes>
      </main>
    </BrowserRouter>
  );
}
