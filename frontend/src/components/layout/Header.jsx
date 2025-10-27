import React, { useEffect, useRef, useState, useContext } from "react";
import BrandLogo from "../../assets/images/Xclarty_logo.svg";
import { useNavigate } from "react-router-dom";
import { clearTokens } from "../../utils/auth";
import { UserContext } from "../../context/UserContext";
import arrowDown from "../../assets/icons/arrow-down.svg";


export default function Header() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);
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

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Logout
  const handleLogout = () => {
    clearTokens();
    setUser(null);
    navigate("/");
  };

  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-6 md:px-0">
        <div>
          <img src={BrandLogo} alt="Brand Logo" className="h-8 md:h-10 w-auto" />
        </div>

        <div className="flex items-center relative" ref={ref}>
          {!user ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="hidden md:inline-block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition mr-2"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Sign up
              </button>
            </>
          ) : (
            <div className="relative flex items-center gap-3">
              {/* Avatar + Nome + Créditos */}
              <div className="flex items-center gap-2">
                {user.picture && imageLoaded ? (
                  <img
                    src={user.picture}
                    key={user.picture}
                    alt="avatar"
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-700 font-semibold text-sm">
                      {user.first_name
                        ? user.first_name[0].toUpperCase()
                        : user.username
                        ? user.username[0].toUpperCase()
                        : "?"}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition px-3 py-1 rounded-full shadow-sm focus:outline-none"
                >
                  <span>{user.first_name || user.username}</span>
                  <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                    <img
                      src="/src/assets/icons/coin.svg"
                      alt="Credits"
                      className="w-4 h-4"
                    />
                    {user.quota ?? 0}
                  </span>
                </button>
              </div>



              {/* Botão do Dropdown */}
              <button
                onClick={() => setOpen((v) => !v)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <img
                  src={arrowDown}
                  alt="Abrir menu"
                  className={`w-4 h-4 transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </button>


              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 top-10 w-36 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  <button
                    onClick={() => navigate("/reports")}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    <img
                      src="/src/assets/icons/reports.svg"
                      alt="Reports"
                      className="w-4 h-4"
                    />
                    Reports
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    <img
                      src="/src/assets/icons/out.svg"
                      alt="Sign out"
                      className="w-4 h-4"
                    />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
