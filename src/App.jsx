// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Product from "./pages/Product.jsx";

const BUILD_STAMP = "BLACKOUT_WEB_200__2026-01-14__A";
console.log("APP_VERSION", "2026-01-14T18:25Z");

export default function App() {
  console.log("[APP] render", BUILD_STAMP, window.location.pathname + window.location.search);

  return (
    <div style={{ minHeight: "100vh", padding: 16, fontFamily: "system-ui" }}>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
        BUILD: <b>{BUILD_STAMP}</b>
        {" · "}
        PATH: <b>{window.location.pathname + window.location.search}</b>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/product" replace />} />
        <Route path="/product" element={<Product />} />
        <Route path="*" element={<Navigate to="/product" replace />} />
      </Routes>
    </div>
  );
}
