import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import XLogo from "../assets/icons/X.svg";
import loadingGif from "../assets/images/loading.gif";
import {
  isCognitoConfigured,
  isLocalAuthMode,
  localLogin,
  redirectToSignIn,
  redirectToSignUp,
} from "../utils/auth";
import { UserContext } from "../context/UserContext";

export default function LoginPage() {
  const [loadingAction, setLoadingAction] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("Password123");
  const navigate = useNavigate();
  const { loadUser } = useContext(UserContext);
  const localMode = isLocalAuthMode();
  const cognitoConfigured = isCognitoConfigured();

  const startAuth = async (action) => {
    setError("");
    setLoadingAction(action);
    try {
      if (action === "signup") {
        await redirectToSignUp();
      } else {
        await redirectToSignIn();
      }
    } catch (err) {
      setError(err.message || "Cognito authentication is not configured.");
      setLoadingAction("");
    }
  };

  const submitLocalLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoadingAction("local-login");
    try {
      await localLogin({ email, password });
      await loadUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-md">
          <img src={XLogo} alt="Logo" className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-semibold text-gray-900 text-center">Welcome</h1>
        <p className="text-gray-700 text-center text-sm mb-2">
          {localMode ? "Use a local development account" : "Use Cognito managed login to continue"}
        </p>

        {localMode ? (
          <form onSubmit={submitLocalLogin} className="w-full flex flex-col gap-4">
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
            <button
              type="submit"
              disabled={Boolean(loadingAction)}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingAction === "local-login" ? (
                <img src={loadingGif} alt="Loading" className="w-5 h-5" />
              ) : (
                "Log in"
              )}
            </button>
          </form>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <button
              type="button"
              onClick={() => startAuth("login")}
              disabled={!cognitoConfigured || Boolean(loadingAction)}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingAction === "login" ? (
                <img src={loadingGif} alt="Loading" className="w-5 h-5" />
              ) : (
                "Continue with managed login"
              )}
            </button>

            <button
              type="button"
              onClick={() => startAuth("signup")}
              disabled={!cognitoConfigured || Boolean(loadingAction)}
              className="w-full py-3 rounded-xl font-semibold text-blue-700 bg-white/70 border border-blue-200 shadow-sm hover:bg-blue-50 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingAction === "signup" ? (
                <img src={loadingGif} alt="Loading" className="w-5 h-5" />
              ) : (
                "Create account"
              )}
            </button>
          </div>
        )}

        {localMode ? (
          <Link to="/signup" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
            Create local account
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => startAuth("login")}
            disabled={!cognitoConfigured || Boolean(loadingAction)}
            className="text-blue-500 hover:text-blue-700 text-sm font-medium disabled:opacity-60"
          >
            Forgot your password?
          </button>
        )}

        <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm">
          Back to home
        </Link>

        {!localMode && !cognitoConfigured && (
          <p className="text-red-600 text-sm text-center">
            Configure VITE_COGNITO_DOMAIN and VITE_COGNITO_USER_POOL_CLIENT_ID.
          </p>
        )}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
