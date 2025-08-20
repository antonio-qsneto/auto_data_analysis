import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./contexts/AuthContext";
import "./styles/index.css";

export default function App() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [businessSummary, setBusinessSummary] = useState("");
  const [insightsText, setInsightsText] = useState(""); // new state for insights

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "REMOVED"}>
      <AuthProvider>
        <AppRoutes
          charts={charts}
          setCharts={setCharts}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          businessSummary={businessSummary}
          setBusinessSummary={setBusinessSummary}
          insightsText={insightsText} // pass insights_text to routes
          setInsightsText={setInsightsText} // optional if you want to update it from children
          theme={theme}
          setTheme={setTheme}
        />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
