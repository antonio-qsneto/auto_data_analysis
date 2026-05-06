import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import loadingGif from "../assets/images/loading.gif";
import { handleAuthCallback } from "../utils/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { loadUser } = useContext(UserContext);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const finishLogin = async () => {
      try {
        await handleAuthCallback();
        await loadUser();
        if (active) navigate("/", { replace: true });
      } catch (err) {
        if (active) setError(err.message || "Could not finish Cognito login.");
      }
    };

    finishLogin();
    return () => {
      active = false;
    };
  }, [loadUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-4">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 text-center">Login failed</h1>
            <p className="text-red-600 text-sm text-center">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <img src={loadingGif} alt="Loading" className="w-10 h-10" />
            <p className="text-gray-700 text-sm">Finishing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}
