import React, { useState } from "react";
import Charts from "../components/charts/Charts";
import SideBar from "../components/layout/SideBar";
import Footer from "../components/layout/Footer";
import { parseInsightsToCards, InsightTextCard } from "./utils/utils";
import ChatWithAI from "../components/layout/ChatWithAI";
import { MessageCircle } from "lucide-react"; // ícone do chat

function parseBusinessSummary(summary) {
  if (!summary) return [];
  const cards = [];
  const metricLineRegex = /^-?\s*([\w\s]+):\s*(.+)$/gm;
  let match;
  while ((match = metricLineRegex.exec(summary)) !== null) {
    const label = match[1].trim();
    const metrics = match[2].split("|").map((s) => s.trim());
    metrics.forEach((metric) => {
      let [key, value] = metric.split("=");
      if (!value && metric.includes(":")) [key, value] = metric.split(":");
      if (value) {
        cards.push({
          title: `${label} ${key.trim()}`,
          value: value.trim(),
        });
      }
    });
  }
  if (cards.length === 0) {
    summary.split("\n").forEach((line) => {
      if (line.trim()) {
        cards.push({
          title: line.slice(0, 20),
          value: line,
        });
      }
    });
  }
  return cards;
}

export default function Dashboard({ charts, theme, setTheme, businessSummary, insightsText }) {
  const [chatOpen, setChatOpen] = useState(false);

  // ✅ estados do chat persistentes
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  const businessCards = parseBusinessSummary(businessSummary);
  const insightCards = parseInsightsToCards(insightsText);

  return (
    <>
      <SideBar />
      <div className="content-area relative">
        {/* Botão alternar tema */}
        <button
          onClick={toggleTheme}
          className={`fixed top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg backdrop-blur-md transition-all duration-300 z-50
            ${theme === "dark"
              ? "bg-white/10 text-cyan-300 hover:bg-white/20"
              : "bg-white/50 text-gray-800 hover:bg-white/70"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>


        {/* Business Summary Cards */}
        <div className="sparkboxes">
          {businessCards.map((card, idx) => (
            <div key={idx} className={`box box${(idx % 4) + 1}`}>
              <strong>{card.title}</strong>
              {card.value}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-grid w-full grid gap-6 mt-6 mb-10">
          <Charts charts={charts} theme={theme} />
        </div>

        {/* Insights */}
        {insightCards.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {insightCards.map((card, idx) => (
              <InsightTextCard
                key={`insight-${idx}`}
                title={card.title}
                blocks={card.blocks}
                theme={theme}
              />
            ))}
          </div>
        )}

        {/* Chat Flutuante */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Botão do chat */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white p-4 rounded-full shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none"
            aria-label="Abrir chat"
          >
            <MessageCircle size={26} />
          </button>

          {/* Container do chat */}
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              chatOpen
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-4 scale-95 pointer-events-none"
            }`}
          >
            {/* Mantém o componente montado sempre — apenas oculta visualmente */}
            <div
              className={`mt-4 w-[400px] max-h-[75vh] rounded-2xl shadow-2xl overflow-hidden ${
                chatOpen ? "visible" : "invisible h-0"
              }`}
            >
              <ChatWithAI
                messages={chatMessages}
                setMessages={setChatMessages}
                input={chatInput}
                setInput={setChatInput}
                loading={chatLoading}
                setLoading={setChatLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
