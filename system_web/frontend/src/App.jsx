import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InputFile from "./components/InputFile";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <InputFile
              setCharts={setCharts}
              setLoading={setLoading}
              setError={setError}
              loading={loading}
              error={error}
              theme={theme}
              setTheme={setTheme}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <Dashboard
              charts={charts}
              theme={theme}
              setTheme={setTheme}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
