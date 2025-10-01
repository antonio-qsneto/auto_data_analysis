import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import SideBar from "../components/layout/SideBar";
import Footer from "../components/layout/Footer";

export default function Reports({ theme, setTheme }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
              Reports
            </h2>
          </div>

          {currentReports.length === 0 ? (
            <p className="text-gray-600 text-center py-20 italic">
              No reports available at the moment.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {currentReports.map((report) => (
                <div
                  key={report.id}
                  className="group relative overflow-hidden rounded-xl border border-blue-200/60 
                            bg-white/60 backdrop-blur-md shadow-md hover:shadow-2xl transition-all p-6 flex justify-between items-start"
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <div className="mb-3">
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
                  </div>

                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm("Are you sure you want to delete this report?")) return;
                      try {
                        await axiosInstance.delete(`/reports/${report.id}/delete/`);
                        setReports((prev) => prev.filter((r) => r.id !== report.id));
                      } catch (err) {
                        alert("Error deleting report: " + (err.response?.data?.error || err.message));
                      }
                    }}
                    className="ml-4 text-red-600 hover:text-red-800 font-semibold text-sm transition self-start"
                  >
                    Delete
                  </button>
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
                className="px-4 py-2 rounded-xl font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed
                          bg-gray-800 text-white hover:bg-gray-700"
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
              <span className="px-4 py-2 rounded-xl shadow-md bg-gray-700 text-white font-semibold">
                {currentPage} / {totalPages}
              </span>

              {/* Next */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl font-semibold shadow-md transition flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed
                          bg-gray-800 text-white hover:bg-gray-700"
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
