import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import XLogo from "../../assets/icons/X.svg";
import csv from "../../assets/icons/fluent_document-table-16-regular.svg";
import database from "../../assets/icons/database.svg";

const navItems = [
  { key: "csv", icon: <img src={csv} alt="CSV Icon" className="w-8 h-8" />, label: "CSV", aria: "CSV" },
  { key: "database", icon: <img src={database} alt="Database Icon" className="w-8 h-8" />, label: "Database", aria: "Database" },
];

export default function SideBar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fetch current user
  useEffect(() => {
    fetch("http://localhost:8000/api/user/me/", {
      method: "GET",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("not-authenticated");
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-20 text-white flex flex-col items-center z-50 shadow-2xl"
      style={{ background: "linear-gradient(to bottom, #2F324A 0%, #5b709aff 100%)" }}
    >
      {/* Logo */}
      <div className="mt-8 mb-10 flex items-center justify-center">
        <button onClick={() => navigate("/")} aria-label="Go to Home" className="focus:outline-none">
          <img src={XLogo} alt="Logo" className="w-8 h-8 cursor-pointer" />
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

      {/* User avatar with dropdown */}
      {user && (
        <div className="relative mb-6" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-cyan-400 shadow-lg overflow-hidden cursor-pointer"
            aria-label="User Profile"
            tabIndex={0}
          >
            {user.picture ? (
              <img src={user.picture} alt="User avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
          </button>

          {open && (
            <div className="absolute left-14 bottom-0 w-40 bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-2 text-sm font-medium border-b border-gray-200">
                {user.name || user.username}
              </div>
              <a
                href="http://localhost:8000/accounts/logout/"
                className="block px-4 py-2 text-sm hover:bg-gray-100"
              >
                Sign out
              </a>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
