import { Navigate } from "react-router-dom";
import { getAccessToken } from "../utils/auth";

export default function PrivateRoute({ children }) {
  const token = getAccessToken();
  return token ? children : <Navigate to="/login" replace />;
}
