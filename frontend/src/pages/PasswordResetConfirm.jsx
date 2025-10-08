import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import XLogo from "../assets/icons/X.svg";

export default function PasswordResetConfirm() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axiosInstance.post("/password-reset/confirm/", {
        token,
        new_password: password,
      });

      setMessage(data.success);

      // Redirect to login after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data.error || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg flex flex-col items-center gap-6">
        
        {/* Circular Logo */}
        <div className="w-20 h-20 rounded-full bg-white/50 backdrop-blur-lg border border-white/50 flex items-center justify-center shadow-md">
          <img src={XLogo} alt="Logo" className="w-12 h-12" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 text-center">Set New Password</h2>
        <p className="text-gray-700 text-center text-sm mb-4">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-600 to-teal-600
                       shadow-md hover:shadow-lg hover:from-green-700 hover:to-teal-700 transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* Feedback messages */}
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
