import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export default function Signup({ onSignupSuccess }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axiosInstance.post("/auth/signup/", {
        username,
        email,
        password,
        password2,
      });

      console.log("Usuário cadastrado:", res.data);

      onSignupSuccess && onSignupSuccess(); // redireciona ou atualiza
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erro ao cadastrar. Tente novamente.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirmar senha"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        required
      />
      <button type="submit">Cadastrar</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
