import React, { useState, useRef } from "react";
import Charts from "./Charts";
import SideBar from "./SideBar";

export default function Dashboard() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  // Handle file selection (from input or drop)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  };

  // Drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileChange(e);
  };

  // Upload handler
  const handleFileUpload = async (file = selectedFile) => {
    if (!file) {
      setError("Please select a CSV file to upload.");
      return;
    }

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
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <SideBar />
      <div
        className="content-area"
        style={{
          marginLeft: 72,
          maxWidth: 1200,
          marginRight: "auto",
          marginTop: 0,
          marginBottom: 0,
          marginInline: "auto",
          padding: 20,
        }}
      >
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

        {/* File Upload with Drag & Drop */}
        <div
          className={`upload-area${dragActive ? " drag-active" : ""}${theme === "light" ? " light" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: dragActive
              ? "2px dashed #2AFADF"
              : "2px dashed #444",
            background: dragActive
              ? (theme === "light" ? "#f5faff" : "#23263a")
              : "transparent",
            borderRadius: 8,
            padding: 32,
            textAlign: "center",
            marginBottom: 30,
            transition: "border 0.2s, background 0.2s"
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <div>
            <p
              style={{
                color: theme === "light" ? "#23263a" : "#b8e3e7",
                marginBottom: 12
              }}
            >
              Drag &amp; drop your <b>CSV</b> file here, or{" "}
              <span
                style={{
                  color: "#2AFADF",
                  cursor: "pointer",
                  textDecoration: "underline"
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                tabIndex={0}
                role="button"
                aria-label="Select file"
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    fileInputRef.current && fileInputRef.current.click();
                  }
                }}
              >
                browse
              </span>
            </p>
            {selectedFile && (
              <div style={{ marginBottom: 10, color: "#4C83FF" }}>
                Selected: <b>{selectedFile.name}</b>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleFileUpload(selectedFile)}
              disabled={!selectedFile || loading}
              style={{
                background: "#2AFADF",
                color: theme === "light" ? "#23263a" : "#23263a",
                border: "none",
                borderRadius: 6,
                padding: "10px 24px",
                fontWeight: "bold",
                fontSize: "1rem",
                cursor: selectedFile && !loading ? "pointer" : "not-allowed",
                opacity: selectedFile && !loading ? 1 : 0.6,
                marginTop: 8
              }}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>

        {loading && <p className="loading">Generating charts...</p>}
        {error && <p className="error">{error}</p>}

        {/* Charts */}
        <div className="charts-grid">
          {charts.map((chart, idx) => (
            <Charts key={idx} charts={[chart]} theme={theme} />
          ))}
        </div>
      </div>
    </>
  );
}
