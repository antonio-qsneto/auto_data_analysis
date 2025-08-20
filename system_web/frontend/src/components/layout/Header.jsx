import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BrandLogo from "../../assets/images/Xclarty_logo.svg";

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 md:px-0">
        
        {/* Left: Brand Logo */}
        <div>
          <img 
            src={BrandLogo} 
            alt="Brand Logo" 
            className="h-8 md:h-10 w-auto cursor-pointer" 
            onClick={() => navigate("/")}
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
        
        {/* Right: Authentication Actions */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 mr-2">
                Welcome, {user?.first_name || user?.email}
              </span>
              <button 
                onClick={handleLogout}
                className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mr-2"
              >
                Log out
              </button>
              <button 
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleLogin}
                className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mr-2"
              >
                Log in
              </button>
              <button 
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Sign up
              </button>
            </>
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
