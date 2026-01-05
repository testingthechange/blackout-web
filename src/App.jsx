// src/App.jsx
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import MyAccount from "./pages/MyAccount.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";

const BACKEND_BASE = (import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");

function useShareIdFromQuery() {
  return useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return String(sp.get("shareId") || "").trim();
  }, [window.location.search]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();

  const shareId = useShareIdFromQuery();

  const [backendStatus, setBackendStatus] = useState("checking");
  useEffect(() => {
    if (!BACKEND_BASE) {
      setBackendStatus("missing");
      return;
    }
    fetch(`${BACKEND_BASE}/api/health`, { cache: "no-store" })
      .then((r) => setBackendStatus(r.ok ? "ok" : "fail"))
      .catch(() => setBackendStatus("fail"));
  }, []);

  const showSearch = loc.pathname === "/" || loc.pathname.startsWith("/shop") || loc.pathname.startsWith("/account");

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>Blackout</div>
          <div style={{ fontSize: 12 }}>
            Backend:{" "}
            {backendStatus === "ok" && "OK"}
            {backendStatus === "fail" && "FAIL"}
            {backendStatus === "missing" && "MISSING ENV"}
            {backendStatus === "checking" && "…"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <Link to="/" style={navLink()}>
            Home
          </Link>
          <Link to={shareId ? `/shop?shareId=${encodeURIComponent(shareId)}` : "/shop"} style={navLink()}>
            Shop
          </Link>
          <Link to={shareId ? `/account?shareId=${encodeURIComponent(shareId)}` : "/account"} style={navLink()}>
            Account
          </Link>
          <Link to="/login" style={navLink()}>
            Login
          </Link>
        </div>

        {showSearch ? (
          <div style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
            <input
              placeholder="Search"
              style={{
                flex: 1,
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                outline: "none",
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.85 }}>
              ShareId: <span style={{ fontFamily: "monospace", fontWeight: 900 }}>{shareId || "—"}</span>
            </div>
          </div>
        ) : null}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop backendBase={BACKEND_BASE} shareId={shareId} />} />
          <Route
            path="/shop/product/:shareId"
            element={
              <Product
                backendBase={BACKEND_BASE}
                onBuy={(id) => nav(`/sold?productId=${encodeURIComponent(id)}`)}
              />
            }
          />
          <Route path="/account" element={<MyAccount backendBase={BACKEND_BASE} shareId={shareId} />} />
          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </div>
  );
}

function navLink() {
  return { color: "white", textDecoration: "none", fontWeight: 900, opacity: 0.9 };
}
