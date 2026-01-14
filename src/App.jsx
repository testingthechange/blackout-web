import React from "react";
import { Routes, Route } from "react-router-dom";
import Product from "./pages/Product.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div style={{ padding: 24 }}>Home (temp)</div>} />
      <Route path="/product" element={<Product />} />
    </Routes>
  );
}
