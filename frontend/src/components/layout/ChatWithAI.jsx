import React, { useEffect, useRef, useCallback } from "react";
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
  const mountedRef = useRef(true);
  const demoStartedRef = useRef(false);
  const timeoutsRef = useRef(new Set());
  const intervalsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      // cleanup ao desmontar
      mountedRef.current = false;
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      intervalsRef.current.forEach((i) => clearInterval(i));
      timeoutsRef.current.clear();
      intervalsRef.current.clear();
    };
  }, []);

  // -------------------------
  // sendMessage: retorna Promise e aceita texto forçado
  // -------------------------
  const sendMessage = useCallback(
    async (forcedValue = null) => {
      const textToSend = (forcedValue ?? input ?? "").toString();

      if (!textToSend.trim()) return;

      // adiciona a mensagem do usuário (local UI)
      const userMessage = { role: "user", text: textToSend };
      setMessages((prev) => [...prev, userMessage]);

      // limpa input e seta loading
      setInput("");
      setLoading(true);

      try {
        const res = await axiosInstance.post("/chat_with_data/", {
          question: textToSend,
        });

        const botText =
        res.data?.answer || "A IA não retornou uma resposta.";
        const botMessage = { role: "assistant", text: botText };

        // adiciona resposta da IA
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
        if (mountedRef.current) setLoading(false);
      }
    },
    // dependências: manter atualizadas setMessages, setInput, setLoading, input
    // (essas funções vêm do pai; useCallback ajuda com referências estáveis)
    [input, setInput, setLoading, setMessages]
  );

  // -------------------------
  // scroll to bottom quando mensagens mudam
  // -------------------------
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // -------------------------
  // Auto-demo: digita, envia e aguarda resposta (com limpeza)
  // -------------------------
  useEffect(() => {
    // não iniciar múltiplas vezes
    if (demoStartedRef.current) return;
    demoStartedRef.current = true;

    const phrases = [
      "What is Tammy McCarthy's profit forecast for next month?",
      "What is the standard deviation of the revenue?",
      "Which employee had the highest average profit?",
      "Which one showed the greatest growth over time?",
    ];

    // util: sleep com registro para cleanup
    const sleep = (ms) =>
    new Promise((resolve) => {
      const t = setTimeout(() => {
        timeoutsRef.current.delete(t);
        resolve();
      }, ms);
      timeoutsRef.current.add(t);
    });

    // digita caractere a caractere (usa setInput funcional)
    const typeText = async (text, charDelay = 50) => {
      // garantir que input esteja vazio antes de digitar
      setInput("");
      await sleep(30); // deixa React atualizar

      for (let i = 0; i < text.length; i++) {
        // Se o componente desmontou, aborta
        if (!mountedRef.current) return;
        setInput((prev) => prev + text[i]);
        // small jitter (parece mais humano)
        await sleep(charDelay + Math.floor(Math.random() * 20));
      }

      // pequena garantia de renderização antes de enviar
      await sleep(120);
    };

    let cancelled = false;

    const runDemo = async () => {
      for (let i = 0; i < phrases.length; i++) {
        if (!mountedRef.current || cancelled) break;

        const text = phrases[i];

        // digita
        await typeText(text, 55);

        if (!mountedRef.current || cancelled) break;
        // espera curtinha antes de enviar (natural)
        await sleep(250);

        if (!mountedRef.current || cancelled) break;
        // envia explicitamente o texto atual (forçando o envio do texto completo)
        await sendMessage(text);

        if (!mountedRef.current || cancelled) break;
        // aguarda a resposta terminar - sendMessage já aguarda a resposta completa,
        // então aqui apenas damos um pequeno tempo extra para animação
        await sleep(600 + Math.floor(Math.random() * 600));
      }
    };

    // inicia após 2s (registro para cleanup)
    const startT = setTimeout(() => {
      runDemo();
    }, 40000);
    timeoutsRef.current.add(startT);

    return () => {
      cancelled = true;
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      intervalsRef.current.forEach((i) => clearInterval(i));
      timeoutsRef.current.clear();
      intervalsRef.current.clear();
    };
    // Dependências: enviar com sendMessage está estável por useCallback.
    // Mantemos empty array para executar só uma vez por montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // execute apenas uma vez por montagem

  // -------------------------
  // handlers de input / teclado (Enter envia)
  // -------------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // envia usando o valor atual do input (evita race)
      // note: sendMessage aceita o valor forçado, mas aqui usamos input atual
      sendMessage();
    }
  };

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="relative flex justify-center items-end w-full h-full bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 rounded-2xl overflow-hidden">
    {/* Caixa principal do chat */}
    <div className="w-full max-w-3xl h-[75vh] flex flex-col justify-between backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-5 text-white">
    {/* Título fixo com ícone spark */}
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

    {/* Área de mensagens */}
    <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-indigo-500/60 scrollbar-track-transparent">
    {messages?.map((m, i) => (
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

    {/* Input */}
    <div className="mt-3 flex items-end gap-3">
    <textarea
    className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
    rows={2}
    placeholder="What was Lucia's average profit in the month of March?"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={handleKeyDown}
    />
    <button
    onClick={() => sendMessage()}
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
