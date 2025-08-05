import React from "react";
import Charts from "./Charts";
import SideBar from "./SideBar";
import SparkBox from "./SparkBox";

// Parse summary into individual metrics for cards
function parseBusinessSummary(summary) {
  if (!summary) return [];
  const cards = [];
  // Find lines like "Year: Mean=2004.66 | Median=2002.00 | Std Dev=9.11 | Range=(1992.00, 2019.00)"
  const metricLineRegex = /^-?\s*([\w\s]+):\s*(.+)$/gm;
  let match;
  while ((match = metricLineRegex.exec(summary)) !== null) {
    const label = match[1].trim();
    const metrics = match[2].split('|').map(s => s.trim());
    metrics.forEach(metric => {
      // Split by '=' or ':' for key-value
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
  // Fallback: if no metrics found, show whole line
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

export default function Dashboard({ charts, theme, setTheme, businessSummary }) {
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  const cards = parseBusinessSummary(businessSummary);

  // Example gradients for up to 6 cards, fallback to blue
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
      <div className="content-area" style={{ marginLeft: 72, maxWidth: 1200, marginInline: "auto", padding: 20 }}>
        <button
          onClick={toggleTheme}
          style={{
            position: "absolute",
            top: 20,
            right: 30,
            padding: "8px 18px",
            borderRadius: "6px",
            border: "none",
            background: "#4C83FF",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          Switch to {theme === "dark" ? "Light" : "Dark"} Theme
        </button>

        {/* Dynamic KPI Cards */}
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

        {/* Charts */}
        <div className="charts-grid">
          {charts.map((chart, idx) => (
            <Charts key={idx} charts={[chart]} theme={theme} />
          ))}
        </div>
      </div>
    </>
  );
}
