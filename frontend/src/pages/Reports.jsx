import React, { useEffect, useState, useMemo } from "react";
import SideBar from "../components/layout/SideBar";
import getCookie from "../utils/helper";
import pdfDark from "../assets/icons/pdf_dark.svg";
import pdfWhite from "../assets/icons/pdf_white.svg";

export default function Report() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    fetchReports();
    document.body.className = theme; // set initial body class
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports/", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`);
      const data = await res.json();
      const normalized = data.map((r) => ({
        ...r,
        created_at: r.created_at ? new Date(r.created_at) : null,
      }));
      setReports(normalized);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      const csrfToken = getCookie("csrftoken");
      const res = await fetch(`/api/reports/${id}/delete/`, {
        method: "DELETE",
        headers: { "X-CSRFToken": csrfToken, "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.status === 204) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete report");
      }
    } catch (err) {
      alert("Error deleting report: " + err.message);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = reports.slice();
    if (q) list = list.filter((r) => (r.name || "").toLowerCase().includes(q));
    if (sort === "newest") list.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    else if (sort === "oldest") list.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
    return list;
  }, [reports, query, sort]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 
      ${theme === "dark" 
        ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-cyan-100" 
        : "bg-gradient-to-br from-blue-50 via-white to-cyan-100 text-gray-900"}`}>
      <SideBar />

      <div className="flex flex-col items-center justify-start w-full px-6 py-12 relative">
        {/* Theme toggle button */}
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

        {/* Header */}
        <div className="max-w-7xl w-full mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Your Reports
            </h1>
          </div>
        </div>

        {/* Main content */}
        <div className="w-full max-w-7xl">
          <div className={`rounded-2xl shadow-lg p-6 ${theme === "dark" ? "bg-white/6" : "bg-white/30"}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Generated Reports</h2>
              <span className="text-sm">{reports.length} total</span>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <div className="p-6 text-red-400">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-white/80">
                <p className="text-lg font-medium">No reports found</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {filtered.map((report) => (
                  <li
                    key={report.id}
                    className={`flex items-center justify-between gap-4 p-4 rounded-lg 
                      ${theme === "dark" ? "bg-gradient-to-r from-white/6 to-white/3 hover:from-white/8" 
                        : "bg-white/40 hover:bg-white/50"} transition`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center">
                        <img
                            src={theme === "dark" ? pdfWhite : pdfDark}
                            alt="PDF Icon"
                            className="h-12 w-12"
                        />
                        </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{report.name}</div>
                        <div className={`text-xs mt-1 ${theme === "dark" ? "text-white/70" : "text-gray-700"}`}>
                          {report.created_at ? report.created_at.toLocaleString() : "Unknown"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a href={report.url} target="_blank" rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition
                          ${theme === "dark" ? "bg-white/10 hover:bg-white/20" : "bg-blue-500/70 hover:bg-blue-600 text-white"}`}>
                        <span>View</span>
                      </a>

                      <button
                        onClick={() => handleDelete(report.id)}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition cursor-pointer
                          ${theme === "dark" ? "bg-red-500/80 hover:bg-red-600 text-white" : "bg-red-500/70 hover:bg-red-600 text-white"}`}
                      >
                        <span>Delete</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
