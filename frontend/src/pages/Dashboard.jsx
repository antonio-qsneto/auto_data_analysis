import React from "react";
import Charts from "../components/charts/Charts";
import SideBar from "../components/layout/SideBar";
import SparkBox from "../components/layout/SparkBox";
import Footer from "../components/layout/Footer";
import InsightCard from "../components/layout/InsightCard";


function parseBusinessSummary(summary) {
  if (!summary) return [];
  const cards = [];
  const metricLineRegex = /^-?\s*([\w\s]+):\s*(.+)$/gm;
  let match;
  while ((match = metricLineRegex.exec(summary)) !== null) {
    const label = match[1].trim();
    const metrics = match[2].split('|').map(s => s.trim());
    metrics.forEach(metric => {
      let [key, value] = metric.split('=');
      if (!value && metric.includes(':')) [key, value] = metric.split(':');
      if (value) {
        cards.push({
          title: `${label} ${key.trim()}`,
          value: value.trim()
        });
      }
    });
  }
  if (cards.length === 0) {
    summary.split('\n').forEach(line => {
      if (line.trim()) {
        cards.push({
          title: line.slice(0, 20),
          value: line
        });
      }
    });
  }
  return cards;
}

export default function Dashboard({ charts, theme, setTheme, businessSummary, insightsText }) {

  console.log(charts)

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  const cards = parseBusinessSummary(businessSummary);

  const gradients = [
    "linear-gradient(135deg, #ABDCFF 10%, #0396FF 100%)",
    "linear-gradient(135deg, #2AFADF 10%, #4C83FF 100%)",
    "linear-gradient(135deg, #FFD3A5 10%, #FD6585 100%)",
    "linear-gradient(135deg, #EE9AE5 10%, #5961F9 100%)",
    "linear-gradient(135deg, #B2FEFA 10%, #0ED2F7 100%)",
    "linear-gradient(135deg, #F6D365 10%, #FDA085 100%)"
  ];

  return (
    <>
      <SideBar />
      <div className="content-area" style={{ marginLeft: 72, maxWidth: 1500, marginInline: "auto", padding: 30 }}>
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-200
            ${theme === "dark"
              ? "bg-gray-900 text-cyan-300 hover:bg-gray-800"
              : "bg-blue-600 text-white hover:bg-blue-700"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? (
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline-block"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline-block"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
          <span className="hidden sm:inline">
            {theme === "dark" ? "Dark" : "Light"} Mode
          </span>
        </button>


        <div className="sparkboxes">
          {cards.map((card, idx) => (
            <SparkBox
              key={idx}
              value={card.value}
              label={card.title}
              gradient={gradients[idx % gradients.length]}
            />
          ))}
        </div>

        
        

        <div className="charts-grid w-full grid gap-6 mt-6 mb-25">
          {charts.map((chart, idx) => (
            <Charts key={idx} charts={[chart]} theme={theme} />
          ))}
        </div>

        <div className="mb-50">
          {insightsText ? <InsightCard insightsText={insightsText} /> : null}
        </div>

      </div>
      <Footer />
    </>
  );
}
