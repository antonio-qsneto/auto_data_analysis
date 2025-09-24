import React, { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function InsightCardAutoHeight({ insightsText }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState("auto");

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight + 80);
    }
  }, [insightsText]);

  if (!insightsText) return null;

  return (
    <div
      className="insight-card-auto w-full bg-[var(--card-bg)] text-[var(--text)] rounded-lg shadow-lg p-5 mb-8"
      style={{ height }}
    >
      <strong className="text-lg block mb-3">Insights</strong>
      <div ref={contentRef} className="prose max-w-full">
        <ReactMarkdown>{insightsText}</ReactMarkdown>
      </div>
    </div>
  );
}
