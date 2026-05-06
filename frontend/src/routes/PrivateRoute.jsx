import { Navigate } from "react-router-dom";
import { hasValidSession } from "../utils/auth";

export default function PrivateRoute({ children }) {
  return hasValidSession() ? children : <Navigate to="/login" replace />;
}
