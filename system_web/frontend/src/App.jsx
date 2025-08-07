import React, { useState, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import "./styles/index.css";

export default function App() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");
  const [businessSummary, setBusinessSummary] = useState("");

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <AppRoutes
      charts={charts}
      setCharts={setCharts}
      loading={loading}
      setLoading={setLoading}
      error={error}
      setError={setError}
      businessSummary={businessSummary}
      setBusinessSummary={setBusinessSummary}
      theme={theme}
      setTheme={setTheme}
    />
  );
}
