import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export default function Signup({ onSignupSuccess }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/signup/", {
        email,
        username,
        password,
        password2,
      });
      onSignupSuccess && onSignupSuccess();
    } catch (err) {
      setError("Erro ao cadastrar usuário");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
      <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <input type="password" placeholder="Confirmar senha" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
      <button type="submit">Cadastrar</button>
      {error && <p>{error}</p>}
    </form>
  );
}
