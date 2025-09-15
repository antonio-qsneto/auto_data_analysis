import { GoogleLogin } from "@react-oauth/google";
import axiosInstance from "../../utils/axiosInstance";
import { setTokens } from "../../utils/auth";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";

export default function GoogleLoginButton({ onLoginSuccess }) {
  const { loadUser } = useContext(UserContext);

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await axiosInstance.post("/auth/google/", {
        id_token: credentialResponse.credential,
      });

      setTokens({ access: res.data.access, refresh: res.data.refresh });

      // 🔑 força atualização imediata do usuário no contexto
      await loadUser();

      onLoginSuccess && onLoginSuccess(res.data.user);
    } catch (error) {
      console.error("Erro ao logar com Google:", error);
    }
  };

  return <GoogleLogin onSuccess={handleSuccess} onError={() => console.error("Login Google falhou")} useOneTap />;
}
