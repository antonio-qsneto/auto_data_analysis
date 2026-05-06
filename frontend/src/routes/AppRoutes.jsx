import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from '../pages/Index';
import UploadPage from '../pages/UploadPage';
import DashboardPage from '../pages/Dashboard';
import DatabasePage from '../pages/DatabasePage';
import Reports from '../pages/Reports';
import LoginPage from '../pages/Login';
import SignUp from '../pages/SignUp';
import AuthCallback from "../pages/AuthCallback";
import PrivateRoute from './PrivateRoute';
import ReportDetail from "../pages/ReportDetail";
import UserProfile from "../pages/UserProfile";



export default function AppRoutes(props) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/SignUp" element={<Navigate to="/signup" replace />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<HomePage {...props} />} />
      <Route path="/upload" element={<PrivateRoute><UploadPage {...props} /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute>{props.charts && props.charts.length > 0 ? (<DashboardPage {...props} />
            ) : (
              <Navigate to="/upload" replace />
            )}
          </PrivateRoute>
        }
      />
      <Route path="/database" element={<PrivateRoute><DatabasePage {...props} /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports {...props}/> </PrivateRoute>} />
      <Route path="/reports/:id" element={<PrivateRoute><ReportDetail {...props}/> </PrivateRoute>} />
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />
      <Route path="/profile" element={<PrivateRoute><UserProfile {...props} /></PrivateRoute>} />

    </Routes>
  );
}
