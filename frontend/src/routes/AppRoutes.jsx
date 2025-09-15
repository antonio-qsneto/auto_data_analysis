import { Routes, Route } from "react-router-dom";
import HomePage from '../pages/Index';
import UploadPage from '../pages/UploadPage';
import DashboardPage from '../pages/Dashboard';
import DatabasePage from '../pages/DatabasePage';
import Reports from '../pages/Reports';
import LoginPage from '../pages/Login';
import SignUp from '../pages/SignUp';
import PrivateRoute from './PrivateRoute';

export default function AppRoutes(props) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/" element={<HomePage {...props} />} />
      <Route path="/upload" element={<PrivateRoute><UploadPage {...props} /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage {...props} /></PrivateRoute>} />
      <Route path="/database" element={<PrivateRoute><DatabasePage {...props} /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports {...props} /></PrivateRoute>} />
    </Routes>
  );
}
