import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import XLogo from "../../assets/icons/X.svg";
import csv from "../../assets/icons/fluent_document-table-16-regular.svg"
import database from "../../assets/icons/database.svg";

const icons = {
  document: (
    <svg aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M7 3h6l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <polyline points="14 3 14 8 19 8" />
    </svg>
  ),
};

const navItems = [
  { key: "csv", icon: <img src={csv} alt="CSV Icon" className="w-8 h-8" />, label: "CSV", aria: "CSV" },
  { key: "database", icon: <img src={database} alt="Database Icon" className="w-8 h-8" />, label: "Database", aria: "Database" },
];

export default function SideBar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Default avatar if user doesn't have a picture
  const defaultAvatarUrl = "https://randomuser.me/api/portraits/men/32.jpg";
  const avatarUrl = user?.picture || defaultAvatarUrl;

  const handleUserClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/");
  };

  return (
    <>
      <nav
        className="fixed left-0 top-0 bottom-0 w-20 text-white flex flex-col items-center z-50 shadow-2xl"
        style={{ background: 'linear-gradient(to bottom, #2F324A 0%, #5b709aff 100%)' }}
      >
        <div className="mt-8 mb-10 flex items-center justify-center">
          <button
            onClick={() => navigate("/")}
            aria-label="Go to Home"
            className="focus:outline-none"
          >
            <img
              src={XLogo}
              alt="Logo"
              className="w-8 h-8 cursor-pointer"
            />
          </button>
        </div>

        {/* Nav icons */}
        <ul className="flex flex-col gap-4 mb-8">
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-cyan-600 focus:bg-cyan-600 transition cursor-pointer"
                aria-label={item.aria}
                tabIndex={0}
                onClick={
                  item.key === "csv"
                    ? () => navigate("/upload")
                    : item.key === "database"
                    ? () => navigate("/database")
                    : undefined
                }
              >
                {item.icon}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        {/* User Profile */}
        <ul className="flex flex-col gap-3 mb-6">
          <li className="relative">
            <button
              className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-cyan-400 shadow-lg overflow-hidden cursor-pointer hover:border-cyan-300 transition"
              aria-label={isAuthenticated ? "User Profile" : "Login"}
              tabIndex={0}
              onClick={handleUserClick}
            >
              <img 
                src={avatarUrl} 
                alt="User avatar" 
                className="w-10 h-10 rounded-full object-cover" 
              />
            </button>
          </li>
        </ul>
      </nav>

      {/* User Menu Popup */}
      {showUserMenu && isAuthenticated && (
        <div className="fixed left-24 bottom-20 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-48">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setShowUserMenu(false);
                navigate("/dashboard");
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setShowUserMenu(false);
                // Add profile page navigation when available
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile Settings
            </button>
            <hr className="my-1" />
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}