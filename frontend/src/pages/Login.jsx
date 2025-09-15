import GoogleLoginButton from "../components/login_components/GoogleLoginButton";
import EmailPasswordLogin from "../components/login_components/EmailPasswordLogin";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleLoginSuccess = () => {
    navigate("/");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div>
        <h1>Login</h1>
        <EmailPasswordLogin onLoginSuccess={handleLoginSuccess} />
        <hr />
        <GoogleLoginButton onLoginSuccess={handleLoginSuccess} />
      </div>
    </GoogleOAuthProvider>
  );
}
