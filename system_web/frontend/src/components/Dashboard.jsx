import React, { useState } from "react";
import Charts from "./Charts";

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
      setCharts(data.charts);
    } catch (err) {
      console.error(err);
      setError("Error uploading file or generating charts.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-area">
      <h1 className="dashboard-title">
        📊 Auto Data Analysis Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="sparkboxes">
        <div className="box box1">
          <strong>1213</strong>
          <p>CLICKS</p>
        </div>
        <div className="box box2">
          <strong>422</strong>
          <p>VIEWS</p>
        </div>
        <div className="box box3">
          <strong>311</strong>
          <p>LEADS</p>
        </div>
        <div className="box box4">
          <strong>22</strong>
          <p>SALES</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="upload-area">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
        />
      </div>

      {loading && <p className="loading">Generating charts...</p>}
      {error && <p className="error">{error}</p>}

      {/* Charts */}
      <div className="charts-grid">
        {charts.map((chart, idx) => (
          <Charts key={idx} charts={[chart]} />
        ))}
      </div>
    </div>
  );
}
