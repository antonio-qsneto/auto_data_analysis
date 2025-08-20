import React, { useState, useEffect, useRef } from "react";
import BrandLogo from "../../assets/images/Xclarty_logo.svg";

export default function Header() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch user info from Django
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/user/", {
      credentials: "include", // include cookies for session auth
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.username) setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        
        {/* Right: Auth buttons or User dropdown */}
        <div className="flex items-center relative" ref={dropdownRef}>
          {!user ? (
            <>
              <button
                onClick={() => { 
                  window.location.href = "http://127.0.0.1:8000/accounts/google/login/";
                }}
                className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mr-2"
              >
                Log in
              </button>
              <button className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
                Sign up
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Hello, {user.username}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <button
                    onClick={() => {
                      window.location.href = "http://127.0.0.1:8000/accounts/logout/";
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

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
