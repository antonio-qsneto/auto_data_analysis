import React, { useState } from "react";
import Charts from "./Charts";
import SideBar from "./SideBar";

export default function Dashboard() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

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
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: 20,
          right: 30,
          padding: "8px 18px",
          borderRadius: "6px",
          border: "none",
          background: "#4C83FF",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 10
        }}
      >
        Switch to {theme === "dark" ? "Light" : "Dark"} Theme
      </button>

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
          <Charts key={idx} charts={[chart]} theme={theme} />
        ))}
      </div>

      <SideBar />
    </div>
  );
}
