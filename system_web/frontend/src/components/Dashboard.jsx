import React, { useState } from 'react';
import Chart from 'chart.js/auto';

export default function Dashboard() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://127.0.0.1:8000/gerar_chart/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate charts");
      }

      const data = await response.json();
      console.log("Charts received:", data.charts);

      setCharts(data.charts);

      // Render charts dynamically after data is received
      setTimeout(() => {
        data.charts.forEach((chart, index) => {
          const ctx = document.getElementById(`chart-${index}`).getContext("2d");
          new Chart(ctx, chart);
        });
      }, 200);

    } catch (err) {
      console.error(err);
      setError("Error uploading file or generating charts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📊 Auto Data Analysis Dashboard</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ marginBottom: "20px" }}
      />

      {loading && <p>Generating charts... Please wait.</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {charts.map((chart, index) => (
          <div key={index} style={{ border: "1px solid #ccc", padding: "10px" }}>
            <canvas id={`chart-${index}`} width="400" height="300"></canvas>
          </div>
        ))}
      </div>
    </div>
  );
}
