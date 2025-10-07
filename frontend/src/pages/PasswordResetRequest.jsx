import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import XLogo from "../assets/icons/X.svg";

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const { data } = await axiosInstance.post("/password-reset/request/", { email });
      setMessage(data.success);
    } catch (err) {
      setError(err.response?.data?.error || "Error sending email. Please try again.");
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

        <h2 className="text-2xl font-semibold text-gray-900 text-center">Reset Password</h2>
        <p className="text-gray-700 text-center text-sm mb-4">
          Enter your email to receive a password reset link
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/70 placeholder-gray-500 text-gray-900 shadow-md
                       focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-md transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600
                       shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Feedback messages */}
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>
    </div>
  );
}
