import React from "react";
import Charts from "./Charts";
import SideBar from "./SideBar";

export default function Dashboard({ charts, theme, setTheme }) {
  // Theme toggle handler
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.body.className = newTheme;
  };

  return (
    <>
      <SideBar />
      <div
        className="content-area"
        style={{
          marginLeft: 72,
          maxWidth: 1200,
          marginRight: "auto",
          marginTop: 0,
          marginBottom: 0,
          marginInline: "auto",
          padding: 20,
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            position: "absolute",
            top: 20,
            right: 30,
            padding: "8px 18px",
            borderRadius: "6px",
            border: "none",
            background: "#4C83FF",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 10
          }}
        >
          Switch to {theme === "dark" ? "Light" : "Dark"} Theme
        </button>

        {/* KPI Cards */}
        <div className="sparkboxes">
          <div className="box box1">
            <strong>1213</strong>
            <p>CLICKS</p>
          </div>
          <div className="box box2">
            <strong>422</strong>
            <p>VIEWS</p>
          </div>
          <div className="box box3">
            <strong>311</strong>
            <p>LEADS</p>
          </div>
          <div className="box box4">
            <strong>22</strong>
            <p>SALES</p>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          {charts.map((chart, idx) => (
            <Charts key={idx} charts={[chart]} theme={theme} />
          ))}
        </div>
      </div>
    </>
  );
}
