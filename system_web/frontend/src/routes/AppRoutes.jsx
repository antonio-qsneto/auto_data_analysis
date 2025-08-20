import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/Index';
import UploadPage from '../pages/UploadPage';
import DashboardPage from '../pages/Dashboard';
import DatabasePage from '../pages/DatabasePage';
import LoginPage from '../components/LoginPage';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRoutes(props) {
  return (
    <Routes>
      <Route path="/" element={<HomePage {...props} />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/upload" element={
        <ProtectedRoute>
          <UploadPage {...props} />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage {...props} />
        </ProtectedRoute>
      } />
      <Route path="/database" element={
        <ProtectedRoute>
          <DatabasePage {...props} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}