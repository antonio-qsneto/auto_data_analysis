import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import SideBar from "../components/layout/SideBar";
import SparkBox from "../components/layout/SparkBox";
import Charts from "../components/charts/Charts";
import Footer from "../components/layout/Footer";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { parseInsightsToCards, InsightTextCard } from "./utils/utils";

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

  const [report, setReport] = useState(null);
  const [error, setError] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchReport() {
      try {
        const res = await axiosInstance.get(`/reports/${id}/`);
        if (!mounted) return;

        setReport(res.data);

        // Delay para permitir fade-in
        setTimeout(() => {
          if (mounted) setShowContent(true);
        }, 200);
      } catch (err) {
        console.error("Erro ao buscar report:", err);
        if (!mounted) return;

        setError(true);
        setShowContent(true);
      }
    }

    fetchReport();
    return () => { mounted = false; };
  }, [id]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  const cards = report ? parseBusinessSummary(report.business_summary) : [];
  const insightsCards = report ? parseInsightsToCards(report.insights_text) : [];

  const isLoading = !report && !error;

  // Classe condicional para o skeleton (claro/escuro)
  const skeletonThemeClass = theme === "dark" ? "dark-skeleton" : "light-skeleton";

  return (
    <>
      <SideBar />

      <div
        className={`flex flex-col items-center w-full relative ${skeletonThemeClass}`}
        style={{
          padding: 20,
          maxWidth: 1500,
          marginInline: "auto",
          marginTop: 20,
          paddingLeft: 92,
        }}
      >

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg backdrop-blur-md transition-all duration-300
            ${
              theme === "dark"
                ? "bg-white/10 text-cyan-300 hover:bg-white/20"
                : "bg-white/50 text-gray-800 hover:bg-white/70"
            }`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>

        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full mb-6">
          {isLoading ? (
            <Skeleton height={32} width={280} />
          ) : (
            <h2
              className={`
                fade-in ${showContent ? "show" : ""}
                text-3xl sm:text-4xl font-extrabold tracking-tight
                bg-clip-text text-transparent
                ${theme === "dark"
                  ? "bg-gradient-to-r from-cyan-300 via-blue-400 to-blue-600 drop-shadow-md"
                  : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500"
                }
                transform transition-all duration-700
                ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
              `}
            >
              Report {report.id}
              {report.created_at ? (
                <span
                  className={`
                    block mt-1 text-lg font-semibold
                    ${theme === "dark" ? "text-gray-300" : "text-gray-700"}
                  `}
                >
                  {new Date(report.created_at).toLocaleString()}
                </span>
              ) : null}
            </h2>

          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="w-full max-w-4xl mx-auto p-6 rounded-xl bg-red-50 border border-red-200 text-red-700">
            Error: Report not found.
          </div>
        )}

        {/* SKELETON CONTENT */}
        {isLoading && (
          <div className="w-full">
            {/* Sparkbox Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-xl border">
                  <Skeleton height={20} width="70%" />
                  <Skeleton height={30} width="40%" style={{ marginTop: 10 }} />
                </div>
              ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid gap-6 mt-6 mb-10">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height={260} className="rounded-xl" />
              ))}
            </div>

            {/* Insights Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 rounded-xl border">
                  <Skeleton height={20} width="60%" />
                  <Skeleton count={4} style={{ marginTop: 10 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTUAL CONTENT WITH FADE-IN */}
        {report && !error && (
          <div className={`fade-in ${showContent ? "show" : ""}`}>
            {/* SparkBoxes */}
            <div className="sparkboxes w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {cards.length === 0 ? (
                <div className="col-span-full text-gray-500 italic">
                  No summary available.
                </div>
              ) : (
                cards.map((card, idx) => (
                  <SparkBox
                    key={idx}
                    value={card.value}
                    label={card.title}
                    gradient={[
                      "linear-gradient(135deg, #ABDCFF 10%, #0396FF 100%)",
                      "linear-gradient(135deg, #2AFADF 10%, #4C83FF 100%)",
                      "linear-gradient(135deg, #FFD3A5 10%, #FD6585 100%)",
                      "linear-gradient(135deg, #EE9AE5 10%, #5961F9 100%)",
                      "linear-gradient(135deg, #B2FEFA 10%, #0ED2F7 100%)",
                      "linear-gradient(135deg, #F6D365 10%, #FDA085 100%)",
                    ][idx % 6]}
                  />
                ))
              )}
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
        )}

      </div>

      <Footer />
    </>
  );
}
