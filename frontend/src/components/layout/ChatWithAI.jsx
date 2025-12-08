import React, { useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import sparkIcon from "../../assets/icons/spark.svg";

export default function ChatWithAI({
  messages,
  setMessages,
  input,
  setInput,
  loading,
  setLoading,
}) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/chat_with_data/", {
        question: input,
      });

      const botText = res.data?.answer || "A IA não retornou uma resposta.";
      const botMessage = { role: "assistant", text: botText };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro no chat:", error);
      const errMsg =
        error.response?.data?.error || "Ocorreu um erro ao consultar a IA.";
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
    <div className="relative flex justify-center items-end w-full h-full bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 rounded-2xl overflow-hidden">
      {/* Caixa principal do chat */}
      <div className="w-full max-w-3xl h-[75vh] flex flex-col justify-between backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-5 text-white">
        
        {/* ✅ Título fixo com ícone spark */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <img
            src={sparkIcon}
            alt="spark icon"
            className="w-6 h-6 drop-shadow-lg animate-pulse"
          />
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent select-none">
            Chat with your Data
          </h2>
        </div>

        {/* ✅ Área de mensagens com limite interno fixo */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-indigo-500/60 scrollbar-track-transparent">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl max-w-[80%] break-words shadow-md ${
                m.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-auto text-right"
                  : "bg-white/15 border border-white/10 text-white mr-auto"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="text-sm text-indigo-300 italic animate-pulse">
              XClarity está analisando os dados...
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* ✅ Input fixo dentro da caixa */}
        <div className="mt-3 flex items-end gap-3">
          <textarea
            className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            rows={2}
            placeholder="Qual a média de lucro do Luiz no mês de Março?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium shadow-md transition-all duration-200 ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 active:scale-95"
            }`}
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
