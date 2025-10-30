import React, { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

export default function ChatWithAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // adiciona mensagem do usuário no chat
    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // envia apenas a pergunta para o backend
      const res = await axiosInstance.post("/chat_with_data/", {
        question: input,
      });

      const botText =
        res.data?.answer || "A IA não retornou uma resposta.";

      const botMessage = { role: "assistant", text: botText };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro no chat:", error);
      const errMsg =
        error.response?.data?.error ||
        "Ocorreu um erro ao consultar a IA.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: errMsg },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container bg-[var(--card-bg)] text-[var(--text)] p-4 rounded-xl shadow-md w-full max-w-3xl mx-auto">
      {/* Título */}
      <h2 className="text-xl font-bold mb-4 text-center">
        💬 Chat com Inteligência Artificial
      </h2>

      {/* Mensagens */}
      <div className="messages space-y-3 mb-4 max-h-80 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[80%] break-words ${
              m.role === "user"
                ? "bg-blue-600 text-white ml-auto text-right"
                : "bg-gray-100 text-black mr-auto"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="text-sm text-blue-400 italic">
            A IA está pensando...
          </div>
        )}
      </div>

      {/* Input e botão */}
      <div className="flex gap-2">
        <textarea
          className="flex-1 border border-[var(--border)] rounded-lg p-2 bg-transparent text-[var(--text)] focus:outline-none"
          rows={2}
          placeholder="Faça uma pergunta sobre os dados (ex: média de vendas entre 18/11/2005 e 13/12/2005)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}
