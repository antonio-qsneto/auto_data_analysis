// frontend/src/pages/UploadPage.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import loadingGif from "../assets/images/loading.gif";
import axiosInstance from "../utils/axiosInstance";

export default function UploadPage({
  setCharts,
  setLoading,
  setError,
  loading,
  error,
  theme,
  setTheme,
  setBusinessSummary,
  setInsightsText,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); // 🆕 exibe status da task
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // 🆕 Reset states on mount to clear sticky loading from prior sessions
  useEffect(() => {
    setLoading && setLoading(false);
    setSelectedFile(null);
    setDragActive(false);
    setStatusMessage("");
    setError && setError("");
  }, [setLoading, setError]);

  // ========== Handlers de Drag & Drop ==========
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError && setError("");
      setStatusMessage(""); // Clear any prior status on new selection
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

  // ========== Upload CSV (agora com Celery) ==========
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError && setError("Please select a CSV file to upload.");
      return;
    }

    setLoading && setLoading(true);
    setError && setError("");
    setStatusMessage("Uploading file...");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1️⃣ Envia CSV e recebe task_id
      const response = await axiosInstance.post("/generate_chart_from_csv/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { task_id } = response.data;
      setStatusMessage("Processing data with AI...");
      console.log("Task created:", task_id);

      // 2️⃣ Polling para acompanhar status da task
      const interval = setInterval(async () => {
        try {
          const res = await axiosInstance.get(`/task_status/${task_id}/`);
          const data = res.data;

          if (data.status === "completed") {
            clearInterval(interval);
            setStatusMessage("✅ Task completed successfully!");
            setCharts && setCharts(data.charts);
            setBusinessSummary && setBusinessSummary(data.business_summary || "");
            setInsightsText && setInsightsText(data.insights_text || "");

            // Pequeno delay para UX suave
            setTimeout(() => navigate("/dashboard"), 1000);
          } else if (data.status === "failed") {
            clearInterval(interval);
            setError && setError("Error processing the file: " + data.error);
            setStatusMessage("Task failed");
            setLoading && setLoading(false);
          } else {
            setStatusMessage(`Status: ${data.status}...`);
          }
        } catch (err) {
          console.error("Error polling task:", err);
          clearInterval(interval);
          setError && setError("Error checking task status.");
          setStatusMessage("Error fetching task status");
          setLoading && setLoading(false);
        }
      }, 3000);
    } catch (err) {
      console.error(err);
      setError && setError("Error uploading file or generating charts.");
      setStatusMessage("Upload failed");
    } finally {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ========== Alternância de Tema ==========
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  // ========== Render ==========
  return (
    <>
      <SideBar />
      <div
        className={`flex flex-col items-center justify-center min-h-screen relative transition-all duration-700
          ${theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a0f] via-[#1b1d26] to-[#0e0e14] text-gray-100"
            : "bg-gradient-to-br from-[#3b5998] via-[#6395c7] to-[#f7a99c] text-gray-900"}
        `}
      >
        {/* Botão Tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg backdrop-blur-md transition-all duration-300
            ${theme === "dark"
              ? "bg-white/10 text-cyan-300 hover:bg-white/20"
              : "bg-white/60 text-gray-800 hover:bg-white/80"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>

        {/* Card Upload */}
        <div className="relative w-full max-w-xl mx-auto mt-24">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className={`rounded-3xl backdrop-blur-xl border transition-all duration-300 shadow-2xl p-12 flex flex-col items-center cursor-pointer ${
              dragActive
                ? "border-cyan-400 scale-105"
                : theme === "dark"
                ? "border-white/20 bg-white/10 text-gray-100"
                : "border-white/50 bg-white/70 text-gray-900"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center gap-4 text-center">
              <svg
                width="60"
                height="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`${theme === "dark" ? "text-cyan-300" : "text-blue-600"} mb-2`}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                />
              </svg>

              <h2 className="text-2xl font-semibold">
                Drag & drop your{" "}
                <span
                  className={`${
                    theme === "dark" ? "text-cyan-400" : "text-blue-600"
                  } font-bold`}
                >
                  CSV
                </span>{" "}
                file here
              </h2>

              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                or click to browse — only CSV files are supported.
              </p>

              {selectedFile && (
                <div
                  className={`mt-3 font-medium ${
                    theme === "dark" ? "text-cyan-300" : "text-blue-600"
                  }`}
                >
                  Selected: <span className="font-bold">{selectedFile.name}</span>
                </div>
              )}

              {/* Botão Upload */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileUpload();
                }}
                disabled={!selectedFile || loading}
                className={`mt-8 px-8 py-3 rounded-2xl font-bold text-white shadow-lg backdrop-blur-md transition-all duration-300 ${
                  selectedFile && !loading
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400"
                      : "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                    : "bg-gray-400/50 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <img src={loadingGif} alt="Loading..." className="w-6 h-6 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 🆕 Status da Task */}
        {statusMessage && (
          <div
            className={`mt-6 text-center font-semibold text-lg ${
              theme === "dark" ? "text-cyan-300" : "text-blue-700"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Erros */}
        {error && (
          <div
            className={`mt-8 text-center font-semibold text-lg ${
              theme === "dark" ? "text-red-400" : "text-red-600"
            }`}
          >
            {error}
          </div>
        )}
      </div>
    </>
  );
}