import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import SideBar from "../components/layout/SideBar";
import Footer from "../components/layout/Footer";

export default function Reports({ theme, setTheme }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingCardId, setLoadingCardId] = useState(null);
  const REPORTS_PER_PAGE = 10;
  const navigate = useNavigate();

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/reports/");
        setReports(res.data); // todos os reports
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

  // === Paginação frontend ===
  const indexOfLastReport = currentPage * REPORTS_PER_PAGE;
  const indexOfFirstReport = indexOfLastReport - REPORTS_PER_PAGE;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);

  const cardClasses = theme === "dark" 
    ? "group relative rounded-xl border border-gray-700 bg-gray-800 shadow-sm hover:shadow-lg transition-all p-6 flex justify-between items-start text-white" 
    : "group relative rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition-all p-6 flex justify-between items-start";

  const h3Classes = theme === "dark" 
    ? "text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors" 
    : "text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors";

  const dateClasses = theme === "dark" ? "text-sm text-gray-400" : "text-sm text-gray-500";
  const pClasses = theme === "dark" ? "text-sm text-gray-300" : "text-sm text-gray-600";

  const deleteClasses = theme === "dark" 
    ? "ml-4 text-red-400 hover:text-red-300 font-semibold text-sm transition self-start" 
    : "ml-4 text-red-600 hover:text-red-800 font-semibold text-sm transition self-start";

  const noReportsClasses = theme === "dark" ? "text-gray-400 text-center py-20 italic" : "text-gray-600 text-center py-20 italic";

  const paginationButtonClasses = theme === "dark" 
    ? "px-4 py-2 rounded-xl font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-gray-800 text-white hover:bg-gray-700 border border-gray-700" 
    : "px-4 py-2 rounded-xl font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-white text-gray-900 hover:bg-gray-50 border border-gray-200";

  const currentPageClasses = theme === "dark" 
    ? "px-4 py-2 rounded-xl shadow-sm bg-gray-700 text-white font-semibold border border-gray-700" 
    : "px-4 py-2 rounded-xl shadow-sm bg-gray-100 text-gray-900 font-semibold border border-gray-200";

  const h2Classes = theme === "dark" ? "text-4xl font-extrabold text-white tracking-tight text-left" : "text-4xl font-extrabold text-gray-900 tracking-tight text-left";

  return (
    <>
      <SideBar />
      {loading && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-6">
            <div className={`w-16 h-16 border-4 ${
              theme === "dark"
                ? "border-gray-600 border-t-blue-500"
                : "border-blue-300 border-t-blue-600"
            } rounded-full animate-spin`} />

            <p className={`text-lg font-semibold ${
              theme === "dark" ? "text-gray-200" : "text-gray-800"
            }`}>
              Loading reports...
            </p>
          </div>
        </div>
      )}

      <div
        className={`min-h-screen w-full relative transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
            : "bg-gradient-to-br from-blue-100 via-white to-blue-50 text-gray-900"
        }`}
      >
        {/* Botão de alternar tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg backdrop-blur-md transition-all duration-300
            ${theme === "dark"
              ? "bg-white/10 text-cyan-300 hover:bg-white/20"
              : "bg-white/50 text-gray-800 hover:bg-white/70"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>

        <div
          className="max-w-4xl mx-auto flex flex-col py-12 px-6"
          style={{ marginLeft: 500 }}
        >
          <div className="mb-10">
            <h2 className={h2Classes}>
              Reports
            </h2>
          </div>

          {currentReports.length === 0 ? (
            <p className={noReportsClasses}>
              No reports available at the moment.
            </p>
          ) : (
            <div className="flex flex-col gap-6 mt-6 mb-8">
              {currentReports.map((report) => (
                <div
                  key={report.id}
                  className={cardClasses}
                  onClick={() => {
                    setLoadingCardId(report.id);
                    setTimeout(() => navigate(`/reports/${report.id}`), 300);
                  }}
                >
                  {loadingCardId === report.id ? (
                    <div className="w-full flex flex-col items-center justify-center py-6">
                      <div
                        className={`w-8 h-8 border-4 rounded-full animate-spin ${
                          theme === "dark"
                            ? "border-gray-600 border-t-blue-400"
                            : "border-gray-300 border-t-blue-600"
                        }`}
                      ></div>
                      <p
                        className={`mt-3 text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Opening report...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 cursor-pointer">
                        <div className="mb-3">
                          <h3 className={h3Classes}>Report {report.id}</h3>
                          <span className={dateClasses}>
                            {new Date(report.created_at).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className={pClasses}>Click to view report details.</p>
                      </div>

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm("Are you sure you want to delete this report?")) return;
                          try {
                            await axiosInstance.delete(`/reports/${report.id}/delete/`);
                            setReports((prev) => prev.filter((r) => r.id !== report.id));
                          } catch (err) {
                            alert(
                              "Error deleting report: " +
                                (err.response?.data?.error || err.message)
                            );
                          }
                        }}
                        className={deleteClasses}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}


          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-3">
              {/* Previous */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={paginationButtonClasses}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Página atual */}
              <span className={currentPageClasses}>
                {currentPage} / {totalPages}
              </span>

              {/* Next */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={paginationButtonClasses}
              >
                Next
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}