import React from "react";
import SideBar from "../components/layout/SideBar";

export default function Report() {
  return (
    <div className="flex h-screen bg-gray-100">
      <SideBar />

      {/* Main content */}
      <main className="flex-1 p-8 ml-20"> 
        <h2 className="text-3xl font-semibold mb-6">Report Page</h2>
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-700">
            Here goes the report content. You can add charts, text, and tables
            here to display insights.
          </p>
        </div>
      </main>
    </div>
  );
}
