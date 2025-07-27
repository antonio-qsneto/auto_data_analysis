import React from "react";
import {
  Bar,
  Line,
  Pie,
  Doughnut,
  PolarArea,
  Radar,
  Bubble,
  Scatter
} from "react-chartjs-2";

export default function Charts({ charts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {charts.map((chart, idx) => {
        const props = {
          data: chart.data, // Chart.js expects { labels, datasets }
          options: chart.options || {
            responsive: true,
            maintainAspectRatio: false
          }
        };

        switch (chart.type) {
          case "bar":
            return <Bar key={idx} {...props} />;
          case "line":
            return <Line key={idx} {...props} />;
          case "pie":
            return <Pie key={idx} {...props} />;
          case "doughnut":
            return <Doughnut key={idx} {...props} />;
          case "polarArea":
            return <PolarArea key={idx} {...props} />;
          case "radar":
            return <Radar key={idx} {...props} />;
          case "bubble":
            return <Bubble key={idx} {...props} />;
          case "scatter":
            return <Scatter key={idx} {...props} />;
          case "boxplot":
            return (
              <div
                key={idx}
                className="p-4 border border-gray-300 rounded bg-gray-100 text-gray-700"
              >
                Box Plot requires plugin (chartjs-chart-box-and-violin-plot)
              </div>
            );
          case "heatmap":
            return (
              <div
                key={idx}
                className="p-4 border border-gray-300 rounded bg-gray-100 text-gray-700"
              >
                Heatmap requires plugin (chartjs-chart-matrix)
              </div>
            );
          default:
            return (
              <div
                key={idx}
                className="p-4 border border-red-300 rounded bg-red-100 text-red-700"
              >
                Unsupported chart type: {chart.type}
              </div>
            );
        }
      })}
    </div>
  );
}
