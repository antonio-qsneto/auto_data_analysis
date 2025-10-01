import React from "react";
import ReactApexChart from "react-apexcharts";

export default function Charts({ charts, theme = "dark" }) {
  if (!charts || charts.length === 0) {
    return (
      <p
        className={`text-center ${
          theme === "dark" ? "text-gray-400" : "text-gray-600"
        }`}
      >
        No charts available
      </p>
    );
  }

  const isWideType = (type) =>
    ["area", "line", "candlestick"].includes(type);

  const placements = [];
  let rowIndex = 0;

  for (let i = 0; i < charts.length; i++) {
    if (placements[i]) continue;

    const chart = charts[i];
    const type = chart.type || "line";
    const wide = isWideType(type);

    const next = charts[i + 1];
    const nextIsWide = next ? isWideType(next.type || "line") : false;

    if (wide) {
      if (next && !nextIsWide) {
        placements[i] = rowIndex % 2 === 0 ? "col-span-2 col-start-1" : "col-span-2 col-start-2";
        placements[i + 1] = rowIndex % 2 === 0 ? "col-span-1 col-start-3" : "col-span-1 col-start-1";
        i++;
      } else {
        placements[i] = rowIndex % 2 === 0 ? "col-span-2 col-start-1" : "col-span-2 col-start-2";
      }
      rowIndex++;
    } else {
      if (next && nextIsWide) {
        placements[i] = rowIndex % 2 === 0 ? "col-span-1 col-start-3" : "col-span-1 col-start-1";
        placements[i + 1] = rowIndex % 2 === 0 ? "col-span-2 col-start-1" : "col-span-2 col-start-2";
        i++;
      } else {
        placements[i] = "";
      }
      rowIndex++;
    }
  }

  const textColor = theme === "dark" ? "#fff" : "#222";
  const gridColor = theme === "dark" ? "#444" : "#ccc";
  const cardBg = theme === "dark" ? "transparent" : "transparent";


  return (
    <>
      {charts.map((chart, idx) => {
        const type = chart.type || "line";
        const chartIdxClass = placements[idx] || "";

        // Filtra candlestick para exibir apenas últimos pontos
        let filteredChart = chart;
        if (
          type === "candlestick" &&
          chart.labels &&
          chart.series &&
          chart.labels.length > 0
        ) {
          const total = chart.labels.length;
          const sliceSize = Math.max(1, Math.floor(total / 10));
          const start = total - sliceSize;
          filteredChart = {
            ...chart,
            labels: chart.labels.slice(start),
            series: chart.series.map((s) => ({
              ...s,
              data: s.data.slice(start),
            })),
          };
        }

        const chartToUse = type === "candlestick" ? filteredChart : chart;

        // Configurações dinâmicas para todos os tipos de chart
        const options = {
          ...chartToUse.options,
          chart: {
            ...chartToUse.options?.chart,
            foreColor: textColor,
            background: cardBg,
          },
          colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
          title: {
            text: chartToUse.title || chartToUse.options?.title?.text || "",
            align: "left",
            style: { color: textColor, fontSize: "18px", fontWeight: 600 },
          },
          tooltip: {
            theme: theme === "dark" ? "dark" : "light",
            style: { color: textColor },
            y: {
              formatter: (val) => {
                if (Array.isArray(val)) return val.map(v => v.toFixed ? v.toFixed(1) : v).join(", ");
                if (typeof val === "number") return val.toFixed(1);
                return val;
              }
            }
          },
          grid: { ...chartToUse.options?.grid, borderColor: gridColor },
          dataLabels: { enabled: false },
          ...(type === "pie" || type === "donut" ? { labels: chart.labels } : {}),
          ...(type === "line" || type === "area" || type === "bar" || type === "column" || type === "candlestick") && {
            xaxis: {
              ...chartToUse.options?.xaxis,
              categories: chart.labels,
              labels: { ...(chartToUse.options?.xaxis?.labels || {}), style: { colors: textColor }, rotate: -45, hideOverlappingLabels: true }
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: { ...(chartToUse.options?.yaxis?.labels || {}), style: { colors: textColor } }
            }
          },
          ...(type === "boxPlot" ? {
            plotOptions: {
              boxPlot: {
                stroke: { colors: [theme === "dark" ? "#e0e0e0" : "#222"], width: 2 }
              }
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: { ...(chartToUse.options?.yaxis?.labels || {}), style: { colors: textColor } }
            }
          } : {}),
          ...(type === "scatter" || type === "bubble" ? {
            xaxis: {
              ...chartToUse.options?.xaxis,
              labels: { ...(chartToUse.options?.xaxis?.labels || {}), style: { colors: textColor } }
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: { ...(chartToUse.options?.yaxis?.labels || {}), style: { colors: textColor } }
            }
          } : {}),
          ...(type === "heatmap" ? {
            theme: { mode: theme === "dark" ? "dark" : "light" },
            plotOptions: { heatmap: { shadeIntensity: 0.7 } }
          } : {})
        };

        const { title, ...optionsWithoutTitle } = options;

        return (
          <div
            key={idx}
            className={`chart-card ${chartIdxClass}`}
            style={{ backgroundColor: cardBg }}
          >

            <div className="chart-title" style={{ color: textColor }}>
              {chartToUse.title || chartToUse.options?.title?.text || ""}
            </div>
            <div className="chart-area">
              <ReactApexChart
                options={optionsWithoutTitle}
                series={chartToUse.series}
                type={type}
                width="100%"
                height="100%"
              />
            </div>
          </div>
        );
      })}
    </>
  );
}
