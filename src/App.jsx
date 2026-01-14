import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Product from "./pages/Product.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/product" replace />} />
      <Route path="/product" element={<Product />} />
      <Route path="*" element={<Navigate to="/product" replace />} />
    </Routes>
  );
}
