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
    <>
      {charts.map((chart, idx) => {
        const type = chart.type || "line";
        let colClass = "";

        // Wide for line, area, candlestick
        const isWide = type === "area" || type === "line" || type === "candlestick";
        if (type === "line" || type === "candlestick") {
          colClass = "col-1-2";
        } else if (type === "area") {
          colClass = "col-2-3";
        }

        // Filter candlestick data to last 3 months
        let filteredChart = chart;
        if (type === "candlestick" && chart.labels && chart.series && chart.labels.length > 0) {
          const total = chart.labels.length;
          const sliceSize = Math.max(1, Math.floor(total / 10));
          const start = total - sliceSize;
          filteredChart = {
            ...chart,
            labels: chart.labels.slice(start),
            series: chart.series.map(s => ({
              ...s,
              data: s.data.slice(start)
            }))
          };
        }

        // Use filteredChart for candlestick, original for others
        const chartToUse = type === "candlestick" ? filteredChart : chart;

        // Build options with correct labels/categories
        const options = {
          ...chartToUse.options,
          chart: {
            ...chartToUse.options?.chart,
            foreColor: textColor,
            background: cardBg,
          },
          colors: [
            "#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"
          ],
          title: {
            text: chartToUse.title || chartToUse.options?.title?.text || "",
            align: "left",
            style: {
              color: textColor,
              fontSize: "18px",
              fontWeight: 600,
            },
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
              formatter: (val) => {
                if (
                  (["line", "area", "bar", "column"].includes(type) && typeof val === "number") ||
                  (type === "boxPlot" && typeof val === "number")
                ) {
                  return val.toFixed(1);
                }
                // For boxPlot, val can be an array [min, q1, median, q3, max]
                if (type === "boxPlot" && Array.isArray(val)) {
                  return val.map(v => typeof v === "number" ? v.toFixed(1) : v).join(", ");
                }
                // For boxPlot, val can be an object with a y property (ApexCharts format)
                if (type === "boxPlot" && val && typeof val === "object" && Array.isArray(val.y)) {
                  return val.y.map(v => typeof v === "number" ? v.toFixed(1) : v).join(", ");
                }
                return val;
              }
            }
          },
          ...(type === "pie" || type === "donut" ? { labels: chart.labels } : {}),
          ...(type === "bar" || type === "column" ? { 
            xaxis: { 
              ...chartToUse.options?.xaxis, 
              categories: chart.labels,
              labels: {
                ...chartToUse.options?.xaxis?.labels,
                style: { colors: textColor },
                rotate: -45,
                hideOverlappingLabels: true,
                trim: true,
                maxHeight: 80,
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          ...(type === "area" ? {
            xaxis: {
              ...chartToUse.options?.xaxis,
              categories: chart.labels,
              tickAmount: 8, // Reduce number of ticks/labels
              labels: {
                ...chartToUse.options?.xaxis?.labels,
                style: { colors: textColor },
                rotate: -45,
                hideOverlappingLabels: true,
                trim: true,
                maxHeight: 80,
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          ...(type === "line" ? {
            xaxis: {
              ...chartToUse.options?.xaxis,
              categories: chart.labels,
              tickAmount: 8,
              labels: {
                ...chartToUse.options?.xaxis?.labels,
                style: { colors: textColor },
                rotate: -45,
                hideOverlappingLabels: true,
                trim: true,
                maxHeight: 80,
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          ...(type === "candlestick" ? {
            xaxis: {
              ...chartToUse.options?.xaxis,
              categories: chart.labels,
              tickAmount: 8,
              labels: {
                ...chartToUse.options?.xaxis?.labels,
                style: { colors: textColor },
                rotate: -45,
                hideOverlappingLabels: true,
                trim: true,
                maxHeight: 80,
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            },
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          ...(type === "heatmap" ? {
            theme: {
              mode: theme === "dark" ? "dark" : "light"
            },
            plotOptions: {
              heatmap: {
                shadeIntensity: 0.7,
                colorScale: {
                  ranges: [
                    { from: -Infinity, to: 0, color: "#374151", name: "Low" },
                    { from: 0, to: 1, color: "#2563eb", name: "Very Low" },
                    { from: 1, to: 10, color: "#0ea5e9", name: "Low" },
                    { from: 10, to: 100, color: "#22d3ee", name: "Medium" },
                    { from: 100, to: 1000, color: "#a21caf", name: "High" },
                    { from: 1000, to: Infinity, color: "#f59e42", name: "Very High" }
                  ]
                }
              }
            }
          } : {}),
          ...(type === "boxPlot" ? {
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          ...(type === "scatter" ? {
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          ...(type === "bubble" ? {
            yaxis: {
              ...chartToUse.options?.yaxis,
              labels: {
                ...chartToUse.options?.yaxis?.labels,
                style: { colors: textColor },
                formatter: (val) =>
                  typeof val === "number"
                    ? val.toFixed(1)
                    : val,
              },
            }
          } : {}),
          grid: {
            ...chartToUse.options?.grid,
            borderColor: gridColor,
          },
        };

        // Remove title from options so it doesn't overlap
        const { title, ...optionsWithoutTitle } = options;

        return (
          <div
            key={idx}
            className={`chart-card${isWide ? " wide" : ""}${colClass ? " " + colClass : ""}`}
            style={{ backgroundColor: cardBg }}
          >
            {/* Title above chart */}
            <div className="chart-title" style={{ color: textColor }}>
              {chartToUse.title || chartToUse.options?.title?.text || ""}
            </div>
            {/* Chart */}
            <div className="chart-area">
              <ReactApexChart
                options={optionsWithoutTitle}
                series={chartToUse.series}
                type={type}
                width="100%"
                height="100%"
              />
            </div>
            {/* Options/Legend below chart */}
            {options.legend && (
              <div className="chart-options">
                <span>
                  {options.legend.position ? `Legend: ${options.legend.position}` : ""}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
