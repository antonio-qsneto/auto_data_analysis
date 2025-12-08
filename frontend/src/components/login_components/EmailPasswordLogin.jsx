import { useState, useContext } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { setTokens } from "../../utils/auth";
import { UserContext } from "../../context/UserContext";

export default function EmailPasswordLogin({ onLoginSuccess, onLoginStart }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loadUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Ativa loading externo
    onLoginStart && onLoginStart();

    try {
      const res = await axiosInstance.post("/token/", { email, password });
      setTokens({ access: res.data.access, refresh: res.data.refresh });

      await loadUser();

      onLoginSuccess && onLoginSuccess();
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("E-mail ou senha inválidos");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 placeholder-gray-400 text-gray-900 shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/60 placeholder-gray-400 text-gray-900 shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
      />
      <button
        type="submit"
        className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500
                   shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transition"
      >
        Login
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-1 text-center">{error}</p>
      )}
    </form>
  );
}
