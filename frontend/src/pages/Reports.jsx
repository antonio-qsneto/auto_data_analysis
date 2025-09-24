import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import SideBar from "../components/layout/SideBar";
import Footer from "../components/layout/Footer";

export default function Reports() {
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
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-50">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinner */}
          <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin" />

          {/* Text */}
          <p className="text-blue-800 text-lg font-semibold tracking-wide">
            Loading reports...
          </p>

          {/* Subtext */}
          <p className="text-gray-500 text-sm">
            Please wait while we fetch your data.
          </p>
        </div>
      </div>
    );

  return (
    <>
      <SideBar />
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-50">
        <div
          className="max-w-4xl mx-auto flex flex-col py-12 px-6"
          style={{ marginLeft: 500 }} // keeps sidebar space
        >
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-blue-900 tracking-tight text-left">
              Reports
            </h2>
          </div>

          {/* List */}
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
