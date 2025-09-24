import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import SideBar from "../components/layout/SideBar";
import Footer from "../components/layout/Footer";

export default function Reports({ theme, setTheme }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await axiosInstance.get("/reports/");
        setReports(res.data);
      } catch (err) {
        console.error("Error loading reports", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-50">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-800 text-lg font-semibold tracking-wide">
            Loading reports...
          </p>
          <p className="text-gray-500 text-sm">
            Please wait while we fetch your data.
          </p>
        </div>
      </div>
    );

  return (
    <>
      <SideBar />
      <div
        className={`min-h-screen w-full relative transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-cyan-100"
            : "bg-gradient-to-br from-blue-100 via-white to-blue-50 text-gray-900"
        }`}
      >
        {/* Botão de alternar tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-200
            ${theme === "dark"
              ? "bg-gray-900 text-cyan-300 hover:bg-gray-800"
              : "bg-blue-600 text-white hover:bg-blue-700"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? (
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline-block"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="inline-block"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
          <span className="hidden sm:inline">
            {theme === "dark" ? "Dark" : "Light"} Mode
          </span>
        </button>

        <div
          className="max-w-4xl mx-auto flex flex-col py-12 px-6"
          style={{ marginLeft: 500 }}
        >
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-blue-900 tracking-tight text-left">
              \     Reports
            </h2>
          </div>

          {reports.length === 0 ? (
            <p className="text-gray-600 text-center py-20 italic">
              No reports available at the moment.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  to={`/reports/${report.id}`}
                  className="group relative overflow-hidden rounded-xl border border-blue-200/60 
                             bg-white/60 backdrop-blur-md shadow-md hover:shadow-2xl transition-all p-6"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-blue-900 group-hover:text-blue-700 transition-colors">
                      Report {report.id}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">
                    Click to view report details.
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
