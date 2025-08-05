import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "./SideBar";
import '../index.css';
import loadingGif from "../assets/loading.gif";


export default function InputFile({
  setCharts,
  setLoading,
  setError,
  loading,
  error,
  theme,
  setTheme,
  setBusinessSummary // NEW
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError && setError("");
    }
  };

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

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError && setError("Please select a CSV file to upload.");
      return;
    }
    setLoading && setLoading(true);
    setError && setError("");
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://127.0.0.1:8000/gerar_chart/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to generate charts");
      const data = await response.json();
      setCharts && setCharts(data.charts);
      setBusinessSummary && setBusinessSummary(data.business_summary || ""); // NEW
      navigate("/dashboard"); // Redirect after upload
    } catch (err) {
      setError && setError("Error uploading file or generating charts.");
    } finally {
      setLoading && setLoading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <>
      <SideBar />
      <div
        className="content-area"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh"
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



        {/* File Upload with Drag & Drop */}
        <div
          className={`upload-area${dragActive ? " drag-active" : ""}${theme === "light" ? " light" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: dragActive
              ? `2px dashed ${theme === "dark" ? "#fff" : "#000"}`
              : `2px dashed ${theme === "dark" ? "#fff" : "#000"}`,
            background: "transparent", // always transparent
            borderRadius: 8,
            padding: 64, // optional: reduce padding for less boxy look
            textAlign: "center",
            marginBottom: 64, // optional: reduce margin for less space
            transition: "border 0.2s, background 0.2s",
            width: 512,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
           <div style={{ background: "transparent" }}>
            <p
              style={{
                fontSize: "1.25rem",
                fontWeight: 500,
                color: theme === "light" ? "#23263a" : "#b8e3e7",
                marginBottom: 12,
                letterSpacing: "0.01em",
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 700 }}>
                Drag &amp; drop
              </span>{" "}
              your <b style={{ color: theme === "dark" ? "#FFD3A5" : "#FD6585" }}>CSV</b> file here, or{" "}
              <span
                style={{
                  color: theme === "dark" ? "#2AFADF" : "#0396FF",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 600,
                  padding: "0 2px",
                  borderRadius: "3px",
                  transition: "background 0.2s",
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
              onClick={handleFileUpload}
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

        {loading && (
            <div className="loading" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
                <img src={loadingGif} alt="Loading..." style={{ width: 32, height: 32 }} />
                <span>Generating charts...</span>
            </div>
            )}
        {error && <p className="error">{error}</p>}


      </div>
    </>
  );
}