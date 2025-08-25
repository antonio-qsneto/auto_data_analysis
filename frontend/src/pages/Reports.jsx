import React, { useState, useEffect } from "react";
import SideBar from "../components/layout/SideBar";

export default function Report() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports/', {  
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />
      <main className="flex-1 p-8 ml-20">
        <h2 className="text-3xl font-semibold mb-6">Your Reports</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {reports.length === 0 && !loading && <p>No reports available.</p>}
        <div className="bg-white shadow-md rounded-lg p-6">
          <ul className="space-y-4">
            {reports.map((report) => (
              <li key={report.id} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <span>{report.name} (Created: {new Date(report.created_at).toLocaleDateString()})</span>
                  <a
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View/Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}