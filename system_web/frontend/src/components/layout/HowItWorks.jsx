import React from "react";

import MagicWandIcon from "../../assets/icons/fluent_magic-wand-20-filled.svg";
import ChartLineIcon from "../../assets/icons/uil_chart-line.svg";
import VectorIcon from "../../assets/icons/Vector.svg";
import CloudUploadIcon from "../../assets/icons/bx_cloud-upload.svg";
import DocumentTableIcon from "../../assets/icons/fluent_document-table-16-regular.svg";

// Example SVG icons (replace with your actual icons or import them)
function RawDataIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" className="fill-blue-400" />
      <path d="M8 12h8M8 16h4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function AutoCleanIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" className="fill-cyan-400" />
      <path d="M8 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function AutoAnalyzeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="11" width="4" height="8" className="fill-indigo-400" />
      <rect x="10" y="7" width="4" height="12" className="fill-indigo-500" />
      <rect x="17" y="4" width="4" height="15" className="fill-indigo-600" />
    </svg>
  );
}
function AutoInsightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="10" className="fill-pink-400" />
      <path d="M12 8v4l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const features = [
  {
    icon: DocumentTableIcon,
    title: "Upload Your Dataset",
    description: "Send or upload your dataset in CSV format with a single click. No complex setup required",
  },
  {
    icon: MagicWandIcon,
    title: "Smart Data Cleaning",
    description: "Our system automatically detects and handles missing values, duplicates, and outliers.",
  },
  {
    icon: VectorIcon,
    title: "AI-Powered Analysis",
    description: "Leverage advanced machine learning to uncover trends, patterns, and anomalies",
  },
  {
    icon: ChartLineIcon,
    title: "Interactive Visual Insights",
    description: "Explore charts, graphs, and trends in an intuitive dashboard",
  },
];

export default function HowItWorks() {
  return (
    <section className="w-full flex flex-col items-center py-20 px-4 bg-white">
      {/* Pill label */}
      <span className="mb-4 px-5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-widest shadow-sm">
        HOW IT WORKS
      </span>
      {/* Heading */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-12 text-center">
        Dataset <span className="text-blue-600">&rarr;</span> Intelligence in 3 clicks
      </h2>
      {/* Features */}
      <div className="w-full max-w-5xl flex flex-wrap justify-center gap-8">
        {features.map(({ icon, title, description }, idx) => (
          <div
            key={title}
            className="flex flex-col items-center flex-1 min-w-[220px] max-w-xs"
          >
            {/* Icon circle with gradient */}
            <div
              className={`w-20 h-20 flex items-center justify-center rounded-full shadow-lg mb-4
                ${idx === 0 ? "bg-gradient-to-br from-cyan-400 via-blue-500 to-blue-900"
                  : idx === 1 ? "bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-600"
                  : idx === 2 ? "bg-gradient-to-br from-green-400 via-cyan-400 to-blue-600"
                  : "bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500"}
              `}
            >
              <img src={icon} alt={title + " icon"} className="w-10 h-10" />
            </div>
            {/* Subtitle */}
            <div className="text-base font-bold text-gray-900 mb-2 tracking-wide text-center">
              {title}
            </div>
            {/* Description */}
            <p className="text-sm text-gray-500 text-center">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}