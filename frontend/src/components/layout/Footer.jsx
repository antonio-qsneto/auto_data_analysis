import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-slate-800 via-gray-900 to-slate-800 text-gray-200 pt-8 pb-4 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-300">About XClarity</h3>
          <p className="text-sm mb-2">
            XClarity – AI-powered dashboard that transforms a dataset into actionable insights with automated charts and analysis.
          </p>
          <span className="inline-block bg-cyan-700 text-cyan-100 text-xs px-3 py-1 rounded-full">
            Turning datasets into decisions, powered by AI.
          </span>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-300">Contact</h3>
          <ul className="space-y-1 text-sm">
            <li>Email: <a href="mailto:xclarity.ai@gmail.com" className="hover:text-cyan-400 transition">xclarity.ia@gmail.com</a></li>
            <li>
              LinkedIn: <a href="https://www.linkedin.com/in/antonio-neto-9a3551202/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition">Profile</a>
            </li>
          </ul>
        </div>

        {/* Technologies */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-300">Technologies</h3>
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-700 text-xs px-2 py-1 rounded text-blue-100">React</span>
            <span className="bg-cyan-700 text-xs px-2 py-1 rounded text-cyan-100">Tailwind CSS</span>
            <span className="bg-indigo-700 text-xs px-2 py-1 rounded text-indigo-100">Django</span>
            <span className="bg-pink-700 text-xs px-2 py-1 rounded text-pink-100">ApexCharts</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
