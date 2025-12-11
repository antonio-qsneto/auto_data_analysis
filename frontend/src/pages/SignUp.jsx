import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import GoogleLoginButton from "../components/login_components/GoogleLoginButton";
import { GoogleOAuthProvider } from "@react-oauth/google";
import XLogo from "../assets/icons/X.svg";
import loadingGif from "../assets/images/loading.gif";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);          // << ADICIONADO
  const [googleLoading, setGoogleLoading] = useState(false);  // << ADICIONADO

  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      await axiosInstance.post("/auth/signup/", {
        username,
        email,
        password,
        password2,
      });

      setSuccess("Cadastro realizado com sucesso! Redirecionando para login...");

      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erro ao cadastrar. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-6">

          {/* Logo */}
          <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-md">
            <img src={XLogo} alt="Logo" className="w-12 h-12" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 text-center">Cadastrar</h1>

          <p className="text-gray-700 text-center text-sm mb-4">
            Crie sua conta para começar
          </p>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition disabled:opacity-60"
            />

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition disabled:opacity-60"
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition disabled:opacity-60"
            />

            <input
              type="password"
              placeholder="Confirmar senha"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition disabled:opacity-60"
            />

            {/* BOTÃO COM LOADING INTERNO */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600
                         shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Signing up...
                </>
              ) : (
                "Cadastrar"
              )}
            </button>
          </form>

          {/* FEEDBACK */}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          {/* Divisor */}
          <div className="flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
            <span className="text-gray-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          </div>

          {/* GOOGLE LOGIN */}
          <div className="w-full flex flex-col items-center gap-3">

            <GoogleLoginButton
              onLoginStart={() => setGoogleLoading(true)}
              onLoginSuccess={() => {
                setGoogleLoading(false);
                navigate("/");
              }}
            />

            {/* LOADING ABAIXO DO BOTÃO GOOGLE */}
            {googleLoading && (
              <div className="flex flex-col items-center mt-1">
                <img src={loadingGif} className="w-10 h-10" alt="Loading" />
                <p className="text-gray-700 text-xs mt-1">Autenticando...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
