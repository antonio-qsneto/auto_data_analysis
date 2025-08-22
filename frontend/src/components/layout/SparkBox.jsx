// frontend/src/components/SparkBox.jsx
import React from "react";

export default function SparkBox({ value, label, gradient }) {
  return (
    <div
      className="sparkbox"
      style={{
        backgroundImage: gradient,
        borderRadius: 8,
        padding: 20,
        textAlign: "center",
        color: "#fff",
        fontSize: "1.2rem",
        boxShadow: "0 8px 24px 0 rgba(0,0,0,0.12)",
      }}
    >
      <strong style={{ fontSize: 22, display: "block", marginBottom: 5 }}>{value}</strong>
      <p style={{ margin: 0 }}>{label}</p>
    </div>
  );
}