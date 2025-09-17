// frontend/src/pages/DatabasePage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBar from "../components/layout/SideBar";
import loadingGif from "../assets/images/loading.gif";
import axiosInstance from "../utils/axiosInstance";

export default function DatabasePage({
  setCharts,
  setLoading,
  setError,
  loading,
  error,
  theme,
  setTheme,
  setBusinessSummary
}) {
  const [dbHost, setDbHost] = useState("");
  const [dbPort, setDbPort] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbName, setDbName] = useState("");
  const [dbType, setDbType] = useState("postgresql");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const navigate = useNavigate();

  // Conectar ao banco e listar tabelas
  const handleConnect = async () => {
    if (!dbHost || !dbPort || !dbUser || !dbPassword || !dbName) {
      setError && setError("Please fill in all database credentials.");
      return;
    }

    setLoading && setLoading(true);
    setError && setError("");
    setTables([]);

    try {
      const response = await axiosInstance.post("/connect_database/", {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        db_type: dbType,
      });

      if (response.data.tables && response.data.tables.length > 0) {
        setTables(response.data.tables);
        setSelectedTable(response.data.tables[0]);
      } else {
        throw new Error("No tables found");
      }
    } catch (err) {
      setError && setError("Error connecting to database: " + err.message);
    } finally {
      setLoading && setLoading(false);
    }
  };

  // Buscar dados da tabela selecionada
  const handleFetchData = async () => {
    if (!selectedTable) {
      setError && setError("Please select a table.");
      return;
    }

    setLoading && setLoading(true);
    setError && setError("");

    try {
      const response = await axiosInstance.post("/fetch_table_data/", {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        db_type: dbType,
        table: selectedTable,
      });

      setCharts && setCharts(response.data.charts);
      setBusinessSummary && setBusinessSummary(response.data.business_summary || "");
      navigate("/dashboard");
    } catch (err) {
      setError && setError("Error fetching table data: " + err.message);
    } finally {
      setLoading && setLoading(false);
    }
  };

  // Tema claro/escuro
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <>
      <SideBar />
      <div
        className={`flex flex-col items-center justify-center min-h-screen relative transition-colors duration-300
          ${theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-cyan-100"
            : "bg-gradient-to-br from-orange-100 via-white to-orange-200 text-gray-900"}
        `}
      >
        {/* Botão de alternar tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg transition-all duration-200
            ${theme === "dark" ? "bg-gray-900 text-cyan-300 hover:bg-gray-800" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="inline-block">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
            </svg>
          ) : (
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="inline-block">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
          <span className="hidden sm:inline">{theme === "dark" ? "Dark" : "Light"} Mode</span>
        </button>

        {/* Card de conexão */}
        <div className="relative w-full max-w-xl mx-auto mt-24">
          <div className="border-4 border-dashed border-gray-300 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center py-12 px-8 transition-all duration-200">
            <h2 className="text-2xl font-bold mb-6 text-blue-700">Connect to your Database</h2>
            <form
              className="w-full flex flex-col gap-4"
              onSubmit={e => { e.preventDefault(); tables.length > 0 ? handleFetchData() : handleConnect(); }}
            >
              {/* Campos do formulário */}
              <select value={dbType} onChange={e => setDbType(e.target.value)} className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none">
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mariadb">MariaDB</option>
                <option value="sqlserver">SQL Server</option>
              </select>

              <input type="text" placeholder="Host" value={dbHost} onChange={e => setDbHost(e.target.value)} className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none" />
              <input type="text" placeholder="Port" value={dbPort} onChange={e => setDbPort(e.target.value)} className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none" />
              <input type="text" placeholder="User" value={dbUser} onChange={e => setDbUser(e.target.value)} className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none" />
              <input type="password" placeholder="Password" value={dbPassword} onChange={e => setDbPassword(e.target.value)} className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none" />
              <input type="text" placeholder="Database Name" value={dbName} onChange={e => setDbName(e.target.value)} className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none" />

              {/* Seleção de tabelas */}
              {tables.length > 0 && (
                <select
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a table</option>
                  {tables.map((table) => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              )}

              {/* Botão principal */}
              <button
                type="submit"
                disabled={loading}
                className={`mt-6 px-8 py-3 rounded-lg font-bold text-white shadow transition ${
                  !loading
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed opacity-70"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <img src={loadingGif} alt="Loading..." className="w-6 h-6 animate-spin" />
                    {tables.length > 0 ? "Fetching..." : "Connecting..."}
                  </span>
                ) : (
                  tables.length > 0 ? "Fetch Data" : "Connect"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Exibe erro */}
        {error && (
          <div className={`mt-8 text-center font-semibold text-lg transition-colors duration-300
            ${theme === "dark" ? "text-red-400" : "text-red-500"}
          `}>
            {error}
          </div>
        )}
      </div>
    </>
  );
}
