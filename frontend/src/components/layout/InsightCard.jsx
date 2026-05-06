import React from "react";
import ReactMarkdown from "react-markdown";

export default function InsightCard({ insightsText }) {
  return (
    <div className="insight-card col-span-3 bg-[var(--card-bg)] text-[var(--text)] rounded-lg shadow-lg p-5 h-[400px] overflow-y-auto mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <strong className="text-lg">Insights</strong>
        <button
          className="bg-[#4C83FF] hover:bg-[#2f5dcc] text-white text-sm px-3 py-1 rounded-md"
          onClick={() => {
            try {
              navigator.clipboard.writeText(insightsText || "");
            } catch {
              // ignore
            }
          }}
          title="Copy"
        >
          Copy
        </button>
      </div>

      {/* Body */}
      <div className="insight-card prose max-w-full mb-8">
        {insightsText ? (
          <ReactMarkdown>{insightsText}</ReactMarkdown>
        ) : (
          <div className="text-gray-400 italic">No insights available.</div>
        )}
      </div>
    </div>
  );
}
