import React from "react";
import ReactApexChart from "react-apexcharts";

export default function Charts({ charts }) {
  if (!charts || charts.length === 0) {
    return <p style={{ color: "#ccc", textAlign: "center" }}>No charts available</p>;
  }

  return (
    <div className="charts-grid">
      {charts.map((chart, idx) => {
        const type = chart.type || "line";

        // Special handling for heatmap
        const isHeatmap = type === "heatmap";
        const options = {
          chart: {
            type,
            toolbar: { show: false },
            background: "transparent"
          },
          theme: { mode: "dark" },
          title: {
            text: chart.title || "",
            align: "center",
            style: { color: "#fff", fontSize: "16px" }
          },
          ...(isHeatmap
            ? {
                dataLabels: { enabled: true, style: { colors: ["#fff"] } },
                xaxis: { labels: { style: { colors: "#fff" } } },
                yaxis: { labels: { style: { colors: "#fff" } } }
              }
            : {
                xaxis: {
                  categories: chart.labels || [],
                  labels: { style: { colors: "#fff" } }
                },
                yaxis: { labels: { style: { colors: "#fff" }, formatter: (val) => val.toFixed(1) } },
                dataLabels: { enabled: false, formatter: (val) => val.toFixed(1), style: { colors: ["#fff"] } }
              }),
          grid: { borderColor: "#444" },
          legend: { labels: { colors: "#fff" } },
          tooltip: { theme: "dark" }
        };

        return (
          <div key={idx} className="chart-card">
            <ReactApexChart options={options} series={chart.series} type={type} width="100%" height="100%" />
          </div>
        );
      })}
    </div>
  );
}
