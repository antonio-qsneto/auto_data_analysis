import GoogleLoginButton from "../components/login_components/GoogleLoginButton";
import EmailPasswordLogin from "../components/login_components/EmailPasswordLogin";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import XLogo from "../assets/icons/X.svg";
import loadingGif from "../assets/images/loading.gif";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [isLoading, setIsLoading] = useState(false);

  const handleLoginStart = () => {
    setIsLoading(true);
  };

  const handleLoginSuccess = () => {
    setIsLoading(false);
    navigate("/");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">

        <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-6">

          {/* Logo */}
          <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-md">
            <img src={XLogo} alt="Logo" className="w-12 h-12" />
          </div>

          <h1 className="text-3xl font-semibold text-gray-900 text-center">Welcome</h1>
          <p className="text-gray-700 text-center text-sm mb-4">
            Log in to your account to continue
          </p>

          {/* Login tradicional */}
          <div className="w-full flex flex-col gap-4">
            <div className="space-y-4">
            <EmailPasswordLogin
              onLoginSuccess={handleLoginSuccess}
              onLoginStart={handleLoginStart}
              disabled={isLoading}
            />
            </div>

            <div className="text-right mt-2">
              <Link
                to="/reset-password"
                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                Forgot your password?
              </Link>
            </div>

          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          </div>

          {/* Botão Google */}
          <div className="w-full flex flex-col items-center gap-3">
            <GoogleLoginButton
              onLoginSuccess={handleLoginSuccess}
              onLoginStart={handleLoginStart}
            />

            {/* GIF aparece AQUI */}
            {isLoading && (
              <div className="flex flex-col items-center mt-2">
                <img src={loadingGif} alt="Loading..." className="w-10 h-10" />
                <p className="text-gray-600 text-xs mt-1">Authenticating...</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </GoogleOAuthProvider>

  );
}
