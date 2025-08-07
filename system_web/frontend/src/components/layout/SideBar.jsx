import React from "react";
import { useNavigate } from "react-router-dom";
import XLogo from "../../assets/images/Xclarty_logo.png";

const icons = {
  document: (
    <svg aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M7 3h6l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <polyline points="14 3 14 8 19 8" />
    </svg>
  ),
  user: (
    <svg aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
    </svg>
  ),
  cube: (
    <svg aria-hidden="true" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  plus: (
    <svg aria-hidden="true" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" stroke="none" fill="url(#plus-gradient)" />
      <defs>
        <linearGradient id="plus-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2AFADF" />
          <stop offset="1" stopColor="#4C83FF" />
        </linearGradient>
      </defs>
      <path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  bell: (
    <svg aria-hidden="true" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
    </svg>
  ),
  gear: (
    <svg aria-hidden="true" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 9 3.09V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const navItems = [
  { key: "document", icon: icons.document, label: "Documents", aria: "Documents" },
  { key: "user", icon: icons.user, label: "User", aria: "User" },
  { key: "cube", icon: icons.cube, label: "Cube", aria: "Cube" },
];

const actionItems = [
  { key: "plus", icon: icons.plus, label: "Add", aria: "Add New" },
  { key: "bell", icon: icons.bell, label: "Notifications", aria: "Notifications" },
  { key: "gear", icon: icons.gear, label: "Settings", aria: "Settings" },
];

export default function SideBar() {
  const navigate = useNavigate();
  const avatarUrl = "https://randomuser.me/api/portraits/men/32.jpg";

  return (
    <nav
      className="fixed left-0 top-0 bottom-0 w-20 text-white flex flex-col items-center z-50 shadow-2xl"
      style={{ background: 'linear-gradient(to bottom, #2F324A 0%, #5b609aff 100%)' }}
    >
      {/* Logo - clickable to Index.jsx */}
      <div className="mt-8 mb-10 flex items-center justify-center">
        <button
          onClick={() => navigate("/")}
          aria-label="Go to Home"
          className="focus:outline-none"
        >
          <img
            src={XLogo}
            alt="Logo"
            className="w-12 h-12 rounded-xl shadow-lg border-cyan-400 cursor-pointer"
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
            >
              {item.icon}
            </button>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      {/* Actions */}
      <ul className="flex flex-col gap-3 mb-6">
        {actionItems.map((item) => (
          <li key={item.key}>
            <button
              className={`w-12 h-12 flex cursor-pointer items-center justify-center rounded-full transition ${
                item.key === "plus"
                  ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg hover:from-blue-500 hover:to-cyan-400"
                  : "hover:bg-cyan-600 focus:bg-cyan-600"
              }`}
              aria-label={item.aria}
              tabIndex={0}
              onClick={item.key === "plus" ? () => navigate("/") : undefined}
            >
              {item.icon}
            </button>
          </li>
        ))}
        {/* Avatar */}
        <li>
          <button
            className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-cyan-400 shadow-lg overflow-hidden cursor-pointer"
            aria-label="User Profile"
            tabIndex={0}
          >
            <img src={avatarUrl} alt="User avatar" className="w-10 h-10 rounded-full object-cover" />
          </button>
        </li>
      </ul>
    </nav>
  );
}