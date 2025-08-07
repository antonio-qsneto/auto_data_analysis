import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-300 text-gray-800 pt-12 pb-6 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-700">About XClarity</h3>
          <p className="text-sm mb-4">
            XClarity – AI-powered dashboard that transforms raw data into actionable insights with automated charts and analysis.
          </p>
          <span className="inline-block bg-cyan-200 text-cyan-900 text-xs px-3 py-1 rounded-full mb-2">
            Turning datasets into decisions, powered by AI.
          </span>
        </div>
        {/* Navigation */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-700">Navigation</h3>
          <ul className="space-y-2">
            <li><a href="/" className="hover:text-cyan-600 transition">Home</a></li>
            <li><a href="#howitworks" className="hover:text-cyan-600 transition">How It Works</a></li>
            <li><a href="#features" className="hover:text-cyan-600 transition">Features</a></li>
            <li><a href="#contact" className="hover:text-cyan-600 transition">Contact</a></li>
          </ul>
        </div>
        {/* Contact */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-700">Contact</h3>
          <ul className="space-y-2 text-sm">
            <li>Email: <a href="mailto:youremail@example.com" className="hover:text-cyan-600 transition">youremail@example.com</a></li>
            <li>
              LinkedIn: <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">Profile</a>
            </li>
            <li>
              GitHub: <a href="https://github.com/yourrepo" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 transition">Repository</a>
            </li>
          </ul>
        </div>
        {/* Technologies & Actions */}
        <div>
          <h3 className="text-lg font-bold mb-2 text-cyan-700">Technologies</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-blue-200 text-xs px-2 py-1 rounded text-blue-900">React</span>
            <span className="bg-cyan-200 text-xs px-2 py-1 rounded text-cyan-900">Tailwind CSS</span>
            <span className="bg-indigo-200 text-xs px-2 py-1 rounded text-indigo-900">FastAPI/Django</span>
            <span className="bg-pink-200 text-xs px-2 py-1 rounded text-pink-900">ApexCharts</span>
            <span className="bg-yellow-200 text-xs px-2 py-1 rounded text-yellow-900">Python</span>
          </div>
          <div className="flex flex-col gap-2">
            <a href="https://github.com/yourrepo" target="_blank" rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-cyan-500 text-white rounded-lg font-semibold shadow hover:bg-cyan-600 transition text-center">
              Check the full code on GitHub
            </a>
            <a href="/cv.pdf" download
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow hover:bg-blue-600 transition text-center">
              Download CV
            </a>
            <a href="mailto:youremail@example.com"
              className="inline-block px-4 py-2 bg-pink-500 text-white rounded-lg font-semibold shadow hover:bg-pink-600 transition text-center">
              Hire me for your next data science project!
            </a>
            <div className="flex gap-2 mt-2">
              <a href="https://your-demo-link.com" target="_blank" rel="noopener noreferrer"
                className="text-xs underline hover:text-cyan-600 transition">Live Demo</a>
              <a href="https://your-docs-link.com" target="_blank" rel="noopener noreferrer"
                className="text-xs underline hover:text-cyan-600 transition">Docs</a>
            </div>
          </div>
        </div>
      </div>
      {/* Legal */}
      <div className="border-t border-cyan-300 mt-8 pt-4 text-center text-xs text-cyan-700">
        © 2025 XClarity. All rights reserved. <br />
        Portfolio Project by <span className="font-bold text-cyan-900">[Your Name]</span>.
      </div>
    </footer>
  );
}