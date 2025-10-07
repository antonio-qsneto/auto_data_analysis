// frontend/src/pages/UserProfile.jsx
import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import axiosInstance from "../utils/axiosInstance";

export default function UserProfile() {
  const { user, setUser } = useContext(UserContext);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.picture) {
      const img = new Image();
      img.src = user.picture;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(false);
    }
  }, [user?.picture]);

  if (!user) return <p>Carregando...</p>;

  const handleDelete = async () => {
    if (confirmText !== "deletar meu perfil") {
      alert('Digite "deletar meu perfil" para confirmar.');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.delete("/user/delete/");
      setUser(null);
      alert("Perfil deletado com sucesso.");
      navigate("/");
    } catch (err) {
      alert("Erro ao deletar perfil: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getInitial = () => {
    if (user.first_name) return user.first_name[0].toUpperCase();
    if (user.username) return user.username[0].toUpperCase();
    return "?";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md flex flex-col items-center relative">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition"
          aria-label="Voltar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Avatar */}
        {user.picture && imageLoaded ? (
          <img
            src={user.picture}
            alt="User Avatar"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <span className="text-5xl font-semibold text-gray-700">{getInitial()}</span>
          </div>
        )}

        {/* Nome e email */}
        <h1 className="text-2xl font-bold mb-1 text-gray-900">{user.first_name || user.username}</h1>
        <p className="text-gray-500 mb-4">{user.email}</p>

        {/* Créditos */}
        <div className="flex items-center gap-2 mb-6">
          <img src="/src/assets/icons/coin.svg" alt="Credits" className="w-5 h-5" />
          <span className="font-semibold text-yellow-600">{user.quota ?? 0}</span>
        </div>

        {/* Deletion */}
        <input
          type="text"
          placeholder='Digite "deletar meu perfil"'
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-red-400"
        />
        <button
          onClick={handleDelete}
          disabled={loading}
          className={`w-full px-6 py-2 rounded-xl text-white font-bold transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading ? "Deletando..." : "Deletar meu perfil"}
        </button>
      </div>
    </div>
  );
}
