import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/Index';
import UploadPage from '../pages/UploadPage';
import DashboardPage from '../pages/Dashboard';
import DatabasePage from '../pages/DatabasePage';

export default function AppRoutes(props) {
  return (
    <Routes>
      <Route path="/" element={<HomePage {...props} />} />
      <Route path="/upload" element={<UploadPage {...props} />} />
      <Route path="/dashboard" element={<DashboardPage {...props} />} />
      <Route path="/database" element={<DatabasePage {...props} />} />
    </Routes>
  );
}