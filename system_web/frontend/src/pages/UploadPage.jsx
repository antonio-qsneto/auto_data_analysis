import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import loadingGif from "../assets/images/loading.gif";

export default function UploadPage({
  setCharts,
  setLoading,
  setError,
  loading,
  error,
  theme,
  setTheme,
  setBusinessSummary
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
      setBusinessSummary && setBusinessSummary(data.business_summary || "");
      navigate("/dashboard");
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
        className={`flex flex-col items-center justify-center min-h-screen relative transition-colors duration-300
          ${theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-cyan-100"
            : "bg-gradient-to-br from-blue-50 via-white to-cyan-100 text-gray-900"}
        `}
      >
        {/* Theme Switch Button */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-200
            ${theme === "dark" ? "bg-gray-900 text-cyan-300 hover:bg-gray-800" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="inline-block">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="inline-block">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
          <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"} Mode</span>
        </button>

        <div
          className={`relative w-full max-w-xl mx-auto mt-24`}
        >
          <div
            className={`border-4 ${dragActive ? "border-blue-400 bg-blue-50" : "border-dashed border-gray-300 bg-white"} rounded-2xl shadow-xl flex flex-col items-center justify-center py-16 px-8 transition-all duration-200`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ cursor: "pointer" }}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center gap-4">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 mb-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
              <p className="text-xl font-semibold text-gray-700">
                Drag &amp; drop your <span className="text-blue-600 font-bold">CSV</span> file here, or <span className="underline text-blue-500 cursor-pointer">browse</span>
              </p>
              <p className="text-sm text-gray-500">Only CSV files are supported.</p>
              {selectedFile && (
                <div className="mt-2 text-blue-600 font-medium">
                  Selected: <span className="font-bold">{selectedFile.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleFileUpload(); }}
                disabled={!selectedFile || loading}
                className={`mt-6 px-8 py-3 rounded-lg font-bold text-white shadow transition ${
                  selectedFile && !loading
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed opacity-70"
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

        {error && (
          <div className={`mt-8 text-center font-semibold text-lg transition-colors duration-300
            ${theme === "dark" ? "text-red-400" : "text-red-500"}
          `}>
            {error}
          </div>
        )}
      </div>
    </>
  );
}