import React from "react";

// SVG icons (Heroicons, MIT)
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
  // Always collapsed, no expand/collapse state
  const avatarUrl = "https://randomuser.me/api/portraits/men/32.jpg";

  return (
    <>
      <nav
        className="sidebar"
        aria-label="Main sidebar"
        tabIndex={0}
      >
        {/* Logo */}
        <div className="sidebar-logo" aria-label="Auto Data Analysis">
          <svg width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2AFADF" />
                <stop offset="1" stopColor="#4C83FF" />
              </linearGradient>
            </defs>
            <text x="7" y="30" fontFamily="Montserrat, Arial" fontWeight="bold" fontSize="32" fill="url(#logo-gradient)">A</text>
          </svg>
        </div>

        {/* Nav icons */}
        <ul className="sidebar-nav" role="menu">
          {navItems.map((item) => (
            <li key={item.key} role="none">
              <button
                className="sidebar-btn"
                aria-label={item.aria}
                tabIndex={0}
              >
                {item.icon}
              </button>
            </li>
          ))}
        </ul>

        {/* Spacer */}
        <div className="sidebar-spacer" />

        {/* Actions */}
        <ul className="sidebar-actions" role="menu">
          {actionItems.map((item) => (
            <li key={item.key} role="none">
              <button
                className={`sidebar-btn${item.key === "plus" ? " sidebar-btn-plus" : ""}`}
                aria-label={item.aria}
                tabIndex={0}
              >
                {item.icon}
              </button>
            </li>
          ))}
          {/* Avatar */}
          <li role="none">
            <button
              className="sidebar-btn sidebar-avatar"
              aria-label="User Profile"
              tabIndex={0}
            >
              <img src={avatarUrl} alt="User avatar" />
            </button>
          </li>
        </ul>
      </nav>
      <style>{`
.sidebar {
  position: fixed;
  left: 0; top: 0; bottom: 0;
  width: 72px;
  background: #23263a;
  color: #b8e3e7;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100;
  box-shadow: 2px 0 16px 0 rgba(0,0,0,0.13);
}
.sidebar-logo {
  margin: 24px 0 32px 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sidebar-nav, .sidebar-actions {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sidebar-nav li, .sidebar-actions li {
  width: 100%;
  display: flex;
  justify-content: center;
}
.sidebar-btn {
  background: none;
  border: none;
  outline: none;
  color: #b8e3e7;
  width: 48px;
  height: 48px;
  margin: 6px 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  cursor: pointer;
  position: relative;
}
.sidebar-btn:focus-visible {
  box-shadow: 0 0 0 2px #2AFADF;
  background: #2b314a;
}
.sidebar-btn:hover, .sidebar-btn:focus {
  background: #2b314a;
  color: #2AFADF;
}
.sidebar-btn-plus {
  background: linear-gradient(135deg, #2AFADF 10%, #4C83FF 100%);
  color: #fff;
  box-shadow: 0 2px 8px 0 rgba(42,250,223,0.18);
}
.sidebar-btn-plus:hover, .sidebar-btn-plus:focus {
  background: linear-gradient(135deg, #4C83FF 10%, #2AFADF 100%);
  color: #fff;
}
.sidebar-avatar {
  padding: 0;
  background: none;
  margin-bottom: 10px;
}
.sidebar-avatar img {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #2AFADF;
  object-fit: cover;
  background: #1a1d2b;
}
.sidebar-label {
  display: none;
}
.sidebar-spacer {
  flex: 1 1 auto;
}
@media (max-width: 600px) {
  .sidebar {
    width: 56px !important;
    min-width: 56px;
  }
}
      `}</style>
    </>
  );
}