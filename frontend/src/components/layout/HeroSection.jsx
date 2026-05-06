import React, { useState, useContext } from "react";
import screenFake from "../../assets/images/screen_fake.png";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { isLocalAuthMode, redirectToSignIn } from "../../utils/auth";

export default function HeroSection() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(false);
  const { user } = useContext(UserContext);

  const handleTryItClick = async () => {
    if (user) {
      // Usuário logado → vai para upload
      navigate("/upload");
    } else {
      if (isLocalAuthMode()) {
        // Usuário não logado → mostra aviso e manda para login local
        setToast(true);
        setTimeout(() => setToast(false), 3000);
        navigate("/login");
        return;
      }

      try {
        await redirectToSignIn();
      } catch {
        navigate("/login");
      }
    }
  };

  return (
    <section className="w-full bg-gradient-to-r from-blue-50 via-white to-cyan-50 py-16 px-6 md:px-12 relative">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left column: Text */}
        <div className="space-y-6 justify-self-start md:pl-0">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
            Turning Data into <br />

            <span
              className="bg-gradient-to-r from-blue-500 via-blue-400 to-orange-400 bg-clip-text text-transparent"
              style={{
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
              }}
            >
              Smart Decisions
            </span>
          </h1>


          <p className="text-lg text-gray-700">
            Auto-Clean. Auto-Analyze. Auto-Visualize. Auto-Insights. Upload your CSV or connect your database, and let the AI handle the rest. 
          </p>

          <p className="text-base text-gray-600 max-w-md">
            It automatically cleans your data, generates charts, and provides insights—repeating the process as many times as you need, fully automated.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
  onClick={handleTryItClick}
  className="
    px-7 py-3 rounded-xl font-semibold text-white
    bg-blue-600
    hover:bg-blue-700
    shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)]
    hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.55)]
    transition-all
  "
>
  Try It →
</button>









          </div>
        </div>

        {/* Right column: Image */}
        <div className="flex justify-end">
          <img
            src={screenFake}
            alt="Data Analysis Dashboard Preview"
            className="rounded-3xl shadow-xl border border-gray-200 w-full max-w-xl object-contain"
            style={{ minWidth: "350px", maxHeight: "600px" }}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-up">
          You must log in first
        </div>
      )}

      {/* Tailwind animation */}
      <style>{`
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </section>
  );
}
