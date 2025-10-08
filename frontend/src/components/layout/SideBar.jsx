import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../../context/UserContext";

import XLogo from "../../assets/icons/X.svg";
import csv from "../../assets/icons/fluent_document-table-16-regular.svg";
import database from "../../assets/icons/database.svg";
import folder from "../../assets/icons/folder.svg";

export default function SideBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loadUser } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const ref = useRef(null);

  // Preload user picture
  useEffect(() => {
    if (user?.picture) {
      const img = new Image();
      img.src = user.picture;
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageLoaded(false);
    }
  }, [user?.picture]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
    loadUser(); // refresh context
  };

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-20 text-white flex flex-col items-center z-50 shadow-2xl"
      style={{ background: "linear-gradient(to bottom, #2b2d3d 0%, #2b2d3d 100%)" }}
    >
      {/* Logo */}
      <div className="mt-8 mb-10 flex items-center justify-center">
        <button
          onClick={() => navigate("/")}
          aria-label="Go to Home"
          className="focus:outline-none"
        >
          <img src={XLogo} alt="Logo" className="w-8 h-8 cursor-pointer" />
        </button>
      </div>

      {/* Navigation */}
      <ul className="flex flex-col gap-4 mb-8">
        <button
          className={`w-12 h-12 flex items-center justify-center rounded-full transition cursor-pointer
            ${location.pathname === "/upload" ? "bg-cyan-600" : "hover:bg-cyan-600"}`}
          aria-label="CSV"
          onClick={() => navigate("/upload")}
        >
          <img src={csv} alt="CSV Icon" className="w-8 h-8" />
        </button>

        <button
          className={`w-12 h-12 flex items-center justify-center rounded-full transition cursor-pointer
            ${location.pathname === "/database" ? "bg-cyan-600" : "hover:bg-cyan-600"}`}
          aria-label="Database"
          onClick={() => navigate("/database")}
        >
          <img src={database} alt="Database Icon" className="w-8 h-8" />
        </button>
      </ul>

      <div className="flex-1" />

      {/* Logged-in user */}
      {user && (
        <div className="flex flex-col items-center gap-4 mb-6" ref={ref}>
          {/* Reports */}
          <button
            className={`w-12 h-12 flex items-center justify-center rounded-full transition cursor-pointer
              ${location.pathname === "/reports" ? "bg-cyan-600" : "hover:bg-cyan-600"}`}
            aria-label="My PDFs"
            onClick={() => navigate("/reports")}
          >
            <img src={folder} alt="Folder Icon" className="w-7 h-7" />
          </button>

          {/* Avatar + dropdown */}
          <div className="relative flex flex-col items-center">
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-cyan-400 shadow-lg overflow-hidden cursor-pointer"
              aria-label="User Profile"
              tabIndex={0}
            >
              <div className="relative w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {user.picture && imageLoaded ? (
                  <img
                    src={user.picture}
                    alt="User"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span
                    className="text-gray-700 font-extrabold text-4xl leading-none transform -translate-y-1"
                  >
                    {user.first_name && user.last_name
                      ? `${user.first_name[0]}${user.last_name[0]}`
                      : user.first_name
                      ? user.first_name[0]
                      : user.username[0]}
                  </span>
                )}
              </div>



            </button>

            {/* Dropdown */}
            {open && (
              <div className="absolute left-14 bottom-0 w-40 bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
                {/* Quota / Credits */}
                <div className="flex items-center gap-1 px-4 py-2 text-yellow-500 text-sm font-semibold border-b border-gray-200">
                  <img src="/src/assets/icons/coin.svg" alt="Credits" className="w-4 h-4" />
                  {user.quota ?? 0}
                </div>

                {/* Nome clicável */}
                <button
                  onClick={() => navigate("/profile")}
                  className="w-full text-left px-4 py-2 text-sm font-medium border-b border-gray-200 hover:bg-gray-100"
                >
                  {user.first_name || user.username}
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>


          

        </div>
      )}
    </nav>
  );
}
