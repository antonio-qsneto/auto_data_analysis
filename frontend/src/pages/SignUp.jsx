import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import XLogo from "../assets/icons/X.svg";
import loadingGif from "../assets/images/loading.gif";
import {
  isCognitoConfigured,
  isLocalAuthMode,
  localSignup,
  redirectToSignIn,
  redirectToSignUp,
} from "../utils/auth";
import { UserContext } from "../context/UserContext";

export default function Signup() {
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  const [username, setUsername] = useState("demo");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Password123");
  const [password2, setPassword2] = useState("Password123");
  const navigate = useNavigate();
  const { loadUser } = useContext(UserContext);
  const localMode = isLocalAuthMode();
  const cognitoConfigured = isCognitoConfigured();

  useEffect(() => {
    if (localMode) return;
    if (!cognitoConfigured) return;

    setRedirecting(true);
    redirectToSignUp().catch((err) => {
      setError(err.message || "Cognito authentication is not configured.");
      setRedirecting(false);
    });
  }, [cognitoConfigured, localMode]);

  const handleLogin = async () => {
    setError("");
    setRedirecting(true);
    try {
      await redirectToSignIn();
    } catch (err) {
      setError(err.message || "Cognito authentication is not configured.");
      setRedirecting(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    setRedirecting(true);
    try {
      await redirectToSignUp();
    } catch (err) {
      setError(err.message || "Cognito authentication is not configured.");
      setRedirecting(false);
    }
  };

  const handleLocalSignup = async (event) => {
    event.preventDefault();
    setError("");
    setRedirecting(true);
    try {
      await localSignup({ username, email, password, password2 });
      await loadUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Erro ao criar conta local.");
      setRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-md">
          <img src={XLogo} alt="Logo" className="w-12 h-12" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 text-center">Create account</h1>
        <p className="text-gray-700 text-center text-sm">
          {localMode
            ? "Create a local development account"
            : redirecting
            ? "Redirecting to Cognito..."
            : "Use Cognito to create your account"}
        </p>

        {redirecting && <img src={loadingGif} alt="Loading" className="w-10 h-10" />}

        {!localMode && !cognitoConfigured && (
          <p className="text-red-600 text-sm text-center">
            Configure VITE_COGNITO_DOMAIN and VITE_COGNITO_USER_POOL_CLIENT_ID.
          </p>
        )}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        {localMode ? (
          <form onSubmit={handleLocalSignup} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 placeholder-gray-400 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 placeholder-gray-400 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 placeholder-gray-400 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
            <input
              type="password"
              placeholder="Confirmar senha"
              value={password2}
              onChange={(event) => setPassword2(event.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 placeholder-gray-400 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />
            <button
              type="submit"
              disabled={redirecting}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Create local account
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSignup}
              disabled={!cognitoConfigured || redirecting}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Open Cognito sign up
            </button>

            <button
              type="button"
              onClick={handleLogin}
              disabled={!cognitoConfigured || redirecting}
              className="w-full py-3 rounded-xl font-semibold text-blue-700 bg-white/70 border border-blue-200 shadow-sm hover:bg-blue-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Log in instead
            </button>
          </div>
        )}

        <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
