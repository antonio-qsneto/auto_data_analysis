import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import GoogleLoginButton from "../components/login_components/GoogleLoginButton";
import { GoogleOAuthProvider } from "@react-oauth/google";
import XLogo from "../assets/icons/X.svg";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // para feedback positivo
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axiosInstance.post("/auth/signup/", {
        username,
        email,
        password,
        password2,
      });

      setSuccess("Cadastro realizado com sucesso! Redirecionando para login...");
      
      // Redireciona após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erro ao cadastrar. Tente novamente.");
      }
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-6">
          
          {/* Logo circular */}
          <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-md">
            <img src={XLogo} alt="Logo" className="w-12 h-12" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 text-center">Cadastrar</h1>
          <p className="text-gray-700 text-center text-sm mb-4">
            Crie sua conta para começar
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
            />
            <input
              type="password"
              placeholder="Confirmar senha"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600
                         shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
            >
              Cadastrar
            </button>
          </form>

          {/* Feedback */}
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          {/* Divisor */}
          <div className="flex items-center gap-3 w-full my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
            <span className="text-gray-500 text-sm">ou</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
          </div>

          {/* Botão Google */}
          <div className="w-full">
            <GoogleLoginButton onLoginSuccess={() => navigate("/")} />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
