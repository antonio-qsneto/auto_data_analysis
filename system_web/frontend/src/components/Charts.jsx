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

  let wideChartCount = 0; // Add this before your map

  return (
    <>
      {charts.map((chart, idx) => {
        const type = chart.type || "line";
        const isWide = type === "area" || type === "line";
        let colClass = "";

        // Alternate columns only for wide charts
        if (isWide) {
          colClass = wideChartCount % 2 === 0 ? "col-1" : "col-2";
          wideChartCount++;
        }

        // Provide default options if not present
        const options = {
          ...chart.options,
          chart: {
            ...chart.options?.chart,
            foreColor: textColor,
            background: cardBg,
          },
          dataLabels: {
            enabled: false,
          },
          tooltip: {
            theme: theme === "dark" ? "dark" : "light",
            style: {
              fontSize: '14px',
              color: textColor,
            },
            y: {
              formatter: (val) =>
                typeof val === "number" ? val.toFixed(1) : val,
            },
          },
          xaxis: {
            ...chart.options?.xaxis,
            labels: {
              ...chart.options?.xaxis?.labels,
              style: { colors: textColor },
              rotate: -45,
              hideOverlappingLabels: true,
              trim: true,
              maxHeight: 80,
              formatter: chart.options?.xaxis?.type === "datetime"
                ? formatDate
                : (val) =>
                    typeof val === "number"
                      ? val.toFixed(1)
                      : val,
            },
            tickAmount: 8,
          },
          yaxis: {
            ...chart.options?.yaxis,
            labels: {
              ...chart.options?.yaxis?.labels,
              style: { colors: textColor },
              formatter: (val) =>
                typeof val === "number" ? val.toFixed(1) : val,
            },
          },
          grid: {
            ...chart.options?.grid,
            borderColor: gridColor,
          },
        };

        return (
          <div
            key={idx}
            className={`chart-card${isWide ? " wide" : ""}${colClass ? " " + colClass : ""}`}
            style={{ backgroundColor: cardBg }}
          >
            <ReactApexChart
              options={options}
              series={chart.series}
              type={type}
              width="100%"
              height="100%"
            />
          </div>
        );
      })}
    </>
  );
}
