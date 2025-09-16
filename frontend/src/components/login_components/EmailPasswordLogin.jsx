import { useState, useContext } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { setTokens } from "../../utils/auth";
import { UserContext } from "../../context/UserContext";

export default function EmailPasswordLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loadUser } = useContext(UserContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      {error && <p>{error}</p>}
    </form>
  );
}
