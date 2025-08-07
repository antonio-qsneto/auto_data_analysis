import React from "react";
import screenFake from "../../assets/images/screen_fake.png";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="w-full bg-gradient-to-r from-blue-50 via-white to-cyan-50 py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
        
        {/* Left column: Text */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Turning Data into <br/>
            <span className="text-blue-600">Smart Decisions</span> 
          </h1>
          
          <p className="text-lg text-gray-700">
            Auto-Clean. Auto-Analyze. Auto-Visualize. Auto-Insights. Auto-Repeat. API. It’s quick, easy, human-in-the-loop or fully AI-assisted.
          </p>
          
          <p className="text-base text-gray-600 max-w-md">
            Empower every department to make data-driven decisions with zero coding required. Simply upload your CSV, Excel or connect via API.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              className="px-6 py-3 font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition cursor-pointer"
              onClick={() => navigate("/upload")}
            >
              Try It →
            </button>
            <button className="px-6 py-3 font-semibold border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition">
              Request a Demo
            </button>
          </div>
        </div>
        
        {/* Right column: Image */}
        <div className="flex justify-center">
          <img
            src={screenFake}
            alt="Data Analysis Dashboard Preview"
            className="rounded-3xl shadow-xl border border-gray-200 w-3/4 max-w-2xl object-contain"
            style={{ minWidth: "750px", maxHeight: "900px" }}
          />
        </div>
      </div>
    </section>
  );
}
