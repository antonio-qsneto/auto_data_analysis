import React from "react";
import Charts from "../components/charts/Charts";
import SideBar from "../components/layout/SideBar";
import Footer from "../components/layout/Footer";
import {parseInsightsToCards, InsightTextCard} from './utils/utils';

// --- Função para parsear business summary (SparkBox mantido) ---
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
      <div className="content-area">
        {/* Botão alternar tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-200
            ${
              theme === "dark"
                ? "bg-gray-900 text-cyan-300 hover:bg-gray-800"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {theme === "dark" ? "Dark Mode" : "Light Mode"}
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


      </div>
      <Footer />
    </>
  );
}
