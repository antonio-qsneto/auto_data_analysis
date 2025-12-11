import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import SideBar from "../components/layout/SideBar";
import SparkBox from "../components/layout/SparkBox";
import Charts from "../components/charts/Charts";
import Footer from "../components/layout/Footer";
import {parseInsightsToCards, InsightTextCard} from './utils/utils';

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


export default function ReportDetail({ theme, setTheme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await axiosInstance.get(`/reports/${id}/`);
        setReport(res.data);
      } catch (err) {
        console.error("Erro ao buscar report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-50">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-800 text-lg font-semibold tracking-wide">
            Loading report...
          </p>
          <p className="text-gray-500 text-sm">
            We are preparing your report for presentation.
          </p>
        </div>
      </div>
    );
  }

  if (!report) {
    return <p className="p-4 text-red-600">Error: Report not found.</p>;
  }

  const cards = parseBusinessSummary(report.business_summary);
  const insightsCards = parseInsightsToCards(report.insights_text);

  const gradients = [
    "linear-gradient(135deg, #ABDCFF 10%, #0396FF 100%)",
    "linear-gradient(135deg, #2AFADF 10%, #4C83FF 100%)",
    "linear-gradient(135deg, #FFD3A5 10%, #FD6585 100%)",
    "linear-gradient(135deg, #EE9AE5 10%, #5961F9 100%)",
    "linear-gradient(135deg, #B2FEFA 10%, #0ED2F7 100%)",
    "linear-gradient(135deg, #F6D365 10%, #FDA085 100%)",
  ];

  return (
    <>
      <SideBar />
      <div
        className="flex flex-col items-center w-full"
        style={{
          padding: 20,
          maxWidth: 1500,
          marginInline: "auto",
          marginTop: 20,
          paddingLeft: 92,
        }}
      >
        {/* Botão de alternar tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg backdrop-blur-md transition-all duration-300
            ${theme === "dark"
              ? "bg-white/10 text-cyan-300 hover:bg-white/20"
              : "bg-white/50 text-gray-800 hover:bg-white/70"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>

        {/* Título */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-6">
          <h2 className="text-2xl font-bold">
            Report {report.id} -{" "}
            {new Date(report.created_at).toLocaleString()}
            {console.log("RAW DATE:", report.created_at)}
          </h2>
        </div>

        {/* SparkBoxes */}
        <div className="sparkboxes w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
        <div className="charts-grid w-full grid gap-6 mt-6 mb-10">
          <Charts charts={report.charts || []} theme={theme} />
        </div>

        {/* Insights */}
        {insightsCards.length > 0 && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {insightsCards.map((card, idx) => (
              <InsightTextCard
                key={idx}
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
