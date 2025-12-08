import { useState, useContext, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { setTokens } from "../../utils/auth";
import { UserContext } from "../../context/UserContext";
import loadingGif from "../../assets/images/loading.gif";
import googleLogo from "../../assets/icons/google.svg";

export default function GoogleLoginButton({ onLoginSuccess }) {
  const { loadUser } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    /* inicializa Google One Tap */
    /* garante que está disponível no window */
    /* o script já deve estar no index.html */
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
    }
  }, []);

  const handleCredential = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/google/", {
        id_token: credentialResponse.credential,
      });

      setTokens({ access: res.data.access, refresh: res.data.refresh });

      await loadUser();

      onLoginSuccess && onLoginSuccess(res.data.user);
    } catch (error) {
      console.error("Erro ao logar com Google:", error);
    } finally {
      setLoading(false);
    }
  };

  const openGooglePopup = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt(); // abre popup Google
    }
  };

  return (
    <button
      onClick={openGooglePopup}
      disabled={loading}
      className={`w-full py-3 rounded-xl border border-gray-300 bg-white shadow-sm
                  flex items-center justify-center gap-2
                  transition font-medium
                  ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-50"}`}
    >
      {loading ? (
        <img src={loadingGif} className="w-5 h-5" alt="loading" />
      ) : (
        <>
          <img src={googleLogo} className="w-5 h-5" alt="Google" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}
