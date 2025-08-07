import React from "react";
import BrandLogo from "../../assets/images/Xclarty_logo.png";

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 md:px-0">
        
        {/* Left: Brand Logo */}
        <div>
          <img 
            src={BrandLogo} 
            alt="Brand Logo" 
            className="h-8 md:h-10 w-auto" 
          />
        </div>
        
        {/* Center: Navigation Links */}
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Home
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Features
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Pricing
          </a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">
            Docs
          </a>
        </nav>
        
        {/* Right: Call-to-Action */}
        <div className="flex items-center">
          <button className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mr-2">
            Log in
          </button>
          <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            Sign up
          </button>
          
          {/* Mobile menu button */}
          <button className="ml-2 md:hidden text-gray-600 hover:text-gray-900 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
