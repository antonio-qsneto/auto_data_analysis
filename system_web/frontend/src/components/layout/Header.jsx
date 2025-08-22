import React, { useEffect, useRef, useState } from "react";
import BrandLogo from "../../assets/images/Xclarty_logo.svg";

export default function Header() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 md:px-0">
        {/* Left: Brand Logo */}
        <div>
          <img src={BrandLogo} alt="Brand Logo" className="h-8 md:h-10 w-auto" />
        </div>

        {/* Center: Nav */}
        <nav className="hidden md:flex space-x-8">
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">Home</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">Features</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">Pricing</a>
          <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition">Docs</a>
        </nav>

        {/* Right: Auth */}
        <div className="flex items-center relative" ref={ref}>
          {!user ? (
            <>
              <button
                onClick={() => { window.location.href = "http://localhost:8000/accounts/login/"; }}
                className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mr-2"
              >
                Log in
              </button>
              <button
                onClick={() => { window.location.href = "http://localhost:8000/accounts/signup/"; }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Sign up
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {user.picture ? (
                  <img src={user.picture} alt="avatar" className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-200" />
                )}
                <span>Hello, {user.name || user.username}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
                </svg>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  <a
                    href="http://localhost:8000/accounts/logout/"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu icon */}
          <button className="ml-2 md:hidden text-gray-600 hover:text-gray-900 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
