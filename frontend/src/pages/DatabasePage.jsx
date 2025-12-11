import React, { useState, useEffect } from "react";
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
  setBusinessSummary,
  setInsightsText,
}) {
  const [dbHost, setDbHost] = useState("");
  const [dbPort, setDbPort] = useState("");
  const [dbUser, setDbUser] = useState("");
  const [dbPassword, setDbPassword] = useState("");
  const [dbName, setDbName] = useState("");
  const [dbConnectionString, setDbConnectionString] = useState(""); // novo
  const [dbType, setDbType] = useState("postgresql");
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  // Reset globals and locals on mount
  useEffect(() => {
    setLoading && setLoading(false);
    setError && setError("");
    setStatusMessage("");
    setTables([]);
    setSelectedTable("");
    setDbHost("");
    setDbPort("");
    setDbUser("");
    setDbPassword("");
    setDbName("");
    setDbConnectionString("");
    setDbType("postgresql");
  }, [setLoading, setError]);

  // Quando troca o tipo de DB limpamos campos que não interessam
  useEffect(() => {
    setTables([]);
    setSelectedTable("");
    setStatusMessage("");
    setError && setError("");
    if (dbType === "mongodb") {
      // limpa campos SQL
      setDbHost("");
      setDbPort("");
      setDbUser("");
      setDbPassword("");
      setDbName("");
    } else {
      // limpa connection string
      setDbConnectionString("");
    }
  }, [dbType, setError]);

  // ======================== CONECTAR AO BANCO ========================
  const handleConnect = async () => {
    // validação condicional: Mongo usa connection string
    if (dbType === "mongodb") {
      if (!dbConnectionString) {
        setError("Please provide a MongoDB connection string.");
        return;
      }
    } else {
      if (!dbHost || !dbPort || !dbUser || !dbPassword || !dbName) {
        setError("Please fill in all database credentials.");
        return;
      }
    }

    setLoading(true);
    setError("");
    setTables([]);
    setStatusMessage("Connecting to database...");

    try {
      // monta payload dependendo do tipo
      let payload;
      if (dbType === "mongodb") {
        payload = {
          connection_string: dbConnectionString,
          db_type: dbType,
        };
      } else {
        payload = {
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          db_type: dbType,
        };
      }

      const response = await axiosInstance.post("/connect_database/", payload);

      if (response.data.tables?.length > 0) {
        setTables(response.data.tables);
        setSelectedTable(response.data.tables[0]);
        setStatusMessage("✅ Connection successful! Tables/Collections loaded.");
      } else {
        // caso a resposta não traga tabelas/collections, ainda informar
        setTables([]);
        setSelectedTable("");
        throw new Error("No tables/collections found in the database.");
      }
    } catch (err) {
      console.error("Connection error:", err);
      setStatusMessage("Connection failed");
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Unable to connect. Please check your credentials or connection string.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ======================== BUSCAR DADOS (ASSÍNCRONO COM CELERY) ========================
  const handleFetchData = async () => {
    if (!selectedTable) {
      setError("Please select a table/collection.");
      return;
    }

    setLoading(true);
    setError("");
    setStatusMessage("Submitting analysis task...");

    try {
      // monta payload de fetch dependendo do tipo
      let payload;
      if (dbType === "mongodb") {
        payload = {
          connection_string: dbConnectionString,
          db_type: dbType,
          table: selectedTable, // aqui 'table' representa collection
        };
      } else {
        payload = {
          host: dbHost,
          port: dbPort,
          user: dbUser,
          password: dbPassword,
          database: dbName,
          db_type: dbType,
          table: selectedTable,
        };
      }

      const response = await axiosInstance.post("/generate_chart_from_database/", payload);

      const { task_id } = response.data;
      if (!task_id) throw new Error("No task ID received from server.");

      setStatusMessage("Processing table data...");
      //console.log("Task started:", task_id);

      // Polling da task
      const interval = setInterval(async () => {
        try {
          const res = await axiosInstance.get(`/task_status/${task_id}/`);
          const data = res.data;

          if (data.status === "completed") {
            clearInterval(interval);
            setStatusMessage("Task completed successfully!");
            setCharts(data.charts);
            setBusinessSummary(data.business_summary || "");
            setInsightsText(data.insights_text || "");

            setTimeout(() => navigate("/dashboard"), 1000);
          } else if (data.status === "failed") {
            clearInterval(interval);
            setError("Error processing data: " + (data.error || "Unknown error"));
            setStatusMessage("Task failed");
            setLoading(false);
          } else {
            setStatusMessage(`Status: ${data.status}...`);
          }
        } catch (err) {
          console.error("Error polling task:", err);
          clearInterval(interval);
          setError("Error fetching task status.");
          setStatusMessage("Error checking task status");
          setLoading(false);
        }
      }, 3000);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Error sending analysis request.");
      setStatusMessage("Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ======================== TEMA ========================
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  // ======================== JSX ========================
  return (
    <>
      <SideBar />

      <div
        className={`flex flex-col items-center justify-center min-h-screen relative transition-all duration-700
          ${theme === "dark"
            ? "bg-gradient-to-br from-[#0a0a0f] via-[#1b1d26] to-[#0e0e14] text-gray-100"
            : "bg-gradient-to-br from-[#cce2ff] via-[#f4d9ff] to-[#ffd6c2] text-gray-900"}
        `}
      >
        {/* Botão de tema */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-10 flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-lg backdrop-blur-md transition-all duration-300
            ${theme === "dark"
              ? "bg-white/10 text-cyan-300 hover:bg-white/20"
              : "bg-white/50 text-gray-800 hover:bg-white/70"}`}
          aria-label="Switch theme"
        >
          {theme === "dark" ? "☾ Dark" : "☀ Light"}
        </button>

        {/* Card principal */}
        <div className="relative w-full max-w-xl mx-auto mt-24">
          <div
            className={`rounded-3xl backdrop-blur-xl border border-white/30 shadow-2xl p-10 flex flex-col items-center transition-all duration-300 ${
              theme === "dark"
                ? "bg-white/10 text-gray-200"
                : "bg-white/60 text-gray-900"
            }`}
          >
            <h2
              className={`text-3xl font-bold mb-6 ${
                theme === "dark" ? "text-cyan-300" : "text-blue-700"
              }`}
            >
              Connect to your Database
            </h2>

            <form
              className="w-full flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                tables.length > 0 ? handleFetchData() : handleConnect();
              }}
            >
              {/* Tipo de banco */}
              <select
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                className={`px-4 py-3 rounded-xl border focus:outline-none backdrop-blur-md appearance-none transition-colors duration-200
                  ${theme === "dark"
                    ? "bg-gray-800/80 text-gray-100 border-white/20 focus:border-cyan-400"
                    : "bg-white/70 text-gray-900 border-gray-300 focus:border-blue-400"}
                `}
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="mariadb">MariaDB</option>
                <option value="mongodb">MongoDB</option>
              </select>

              {/* Quando for Mongo: apenas connection string */}
              {dbType === "mongodb" ? (
                <input
                  type="text"
                  placeholder="MongoDB Connection String (mongodb://... or mongodb+srv://...)"
                  value={dbConnectionString}
                  onChange={(e) => setDbConnectionString(e.target.value)}
                  className={`px-4 py-3 rounded-xl border focus:outline-none backdrop-blur-md transition ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 text-gray-100 placeholder-gray-400 focus:border-cyan-400"
                      : "bg-white/60 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400"
                  }`}
                />
              ) : (
                // Campos de conexão para DB SQL
                [
                  { placeholder: "Host", value: dbHost, setter: setDbHost },
                  { placeholder: "Port", value: dbPort, setter: setDbPort },
                  { placeholder: "User", value: dbUser, setter: setDbUser },
                  { placeholder: "Password", value: dbPassword, setter: setDbPassword, type: "password" },
                  { placeholder: "Database Name", value: dbName, setter: setDbName },
                ].map((f, i) => (
                  <input
                    key={i}
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={(e) => f.setter(e.target.value)}
                    className={`px-4 py-3 rounded-xl border focus:outline-none backdrop-blur-md transition ${
                      theme === "dark"
                        ? "bg-white/10 border-white/20 text-gray-100 placeholder-gray-400 focus:border-cyan-400"
                        : "bg-white/60 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-400"
                    }`}
                  />
                ))
              )}

              {/* Select de tabelas / collections */}
              {tables.length > 0 && (
                <div className="w-full relative">
                  <label
                    htmlFor="tableSelect"
                    className={`block text-sm font-semibold mb-2 ${
                      theme === "dark" ? "text-cyan-300" : "text-blue-700"
                    } animate-pulse`}
                  >
                    🔍 Choose the table/collection to analyze
                  </label>

                  <select
                    id="tableSelect"
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className={`px-4 py-3 rounded-xl border focus:outline-none appearance-none transition-all duration-300 w-full shadow-lg 
                      ${theme === "dark"
                        ? "bg-gray-800/80 text-gray-100 border-cyan-400/40 focus:border-cyan-300 ring-2 ring-cyan-400/30"
                        : "bg-white/80 text-gray-900 border-blue-300 focus:border-blue-400 ring-2 ring-blue-400/30"}
                      animate-[pulse_2s_ease-in-out_infinite]
                    `}
                  >
                    <option value="">Select a table/collection</option>
                    {tables.map((table) => (
                      <option key={table} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Botão principal */}
              <button
                type="submit"
                disabled={loading}
                className={`mt-6 px-8 py-3 rounded-2xl font-bold text-white shadow-lg backdrop-blur-md transition-all duration-300 ${
                  !loading
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400"
                      : "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
                    : "bg-gray-400/50 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <img
                      src={loadingGif}
                      alt="Loading..."
                      className="w-6 h-6 animate-spin"
                    />
                    {tables.length > 0 ? "Fetching..." : "Connecting..."}
                  </span>
                ) : tables.length > 0 ? (
                  "Fetch Data"
                ) : (
                  "Connect"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 🆕 Status visual */}
        {statusMessage && (
          <div
            className={`
              mt-8 
              text-center 
              text-base 
              font-medium 
              tracking-tight
              ${theme === "dark" ? "text-neutral-200" : "text-neutral-800"}
            `}
          >
            {statusMessage}
          </div>
        )}

        {error && (
          <div
            className={`
              mt- 8 
              text-center 
              text-base 
              font-medium 
              tracking-tight
              max-w-xl 
              px-4 
              mx-auto
              ${theme === "dark" ? "text-red-300" : "text-red-500"}
            `}
          >
            {error}
          </div>
        )}

      </div>
    </>
  );
}
