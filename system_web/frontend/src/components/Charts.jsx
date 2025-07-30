import React from "react";
import ReactApexChart from "react-apexcharts";

export default function Charts({ charts, theme = "dark" }) {
  if (!charts || charts.length === 0) {
    return <p style={{ color: theme === "dark" ? "#ccc" : "#888", textAlign: "center" }}>No charts available</p>;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  };

  // Set colors based on theme
  const textColor = theme === "dark" ? "#fff" : "#222";
  const gridColor = theme === "dark" ? "#444" : "#ccc";
  const cardBg = theme === "dark" ? "#2B2D3E" : "#fff";

  return (
    <div className="charts-grid">
      {charts.map((chart, idx) => {
        const type = chart.type || "line";
        const isHeatmap = type === "heatmap";
        const options = {
          chart: {
            type,
            toolbar: { show: false },
            background: "transparent"
          },
          theme: { mode: theme },
          title: {
            text: chart.title || "",
            align: "center",
            style: { color: textColor, fontSize: "16px" }
          },
          ...(isHeatmap
            ? {
                dataLabels: { enabled: true, style: { colors: [textColor] } },
                xaxis: { labels: { style: { colors: textColor } } },
                yaxis: { labels: { style: { colors: textColor } } }
              }
            : {
                xaxis: {
                  categories: chart.labels || [],
                  labels: {
                    style: { colors: textColor },
                    formatter: (val) => formatDate(val)
                  }
                },
                yaxis: {
                  labels: {
                    style: { colors: textColor },
                    formatter: (val) => Number(val).toFixed(1)
                  }
                },
                dataLabels: {
                  enabled: false,
                  formatter: (val) => Number(val).toFixed(1),
                  style: { colors: [textColor] }
                }
              }),
          grid: { borderColor: gridColor },
          legend: { labels: { colors: textColor } },
          tooltip: {
            theme: theme,
            y: {
              formatter: (val) => Number(val).toFixed(1)
            }
          }
        };

        return (
          <div key={idx} className="chart-card" style={{ backgroundColor: cardBg }}>
            <ReactApexChart options={options} series={chart.series} type={type} width="100%" height="100%" />
          </div>
        );
      })}
    </div>
  );
}
