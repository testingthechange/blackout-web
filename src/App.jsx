// src/App.jsx
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import MyAccount from "./pages/MyAccount.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";

import BottomPlayer from "./components/BottomPlayer.jsx";

// SINGLE SOURCE OF TRUTH
const BACKEND_BASE = (import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // only Shop uses ?shareId=...
  const shareId = String(searchParams.get("shareId") || "").trim();

  // backend health
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

  // player state
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTrack = queue[idx] || null;

  // show player only on product + account (not on shop marketing)
  const playerVisible =
    loc.pathname.startsWith("/shop/product") ||
    loc.pathname.startsWith("/account") ||
    loc.pathname.startsWith("/sold");

  const mode = loc.pathname.startsWith("/account") ? "full" : "preview";

  const setPlayContext = ({ tracks, index }) => {
    if (!Array.isArray(tracks) || !tracks.length) return;
    setQueue(tracks);
    setIdx(Math.max(0, Number(index || 0)));
    setIsPlaying(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 18px 120px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>Block Radius</div>
          <div style={{ fontSize: 12 }}>
            Backend:{" "}
            {backendStatus === "ok" && "OK"}
            {backendStatus === "fail" && "FAIL"}
            {backendStatus === "missing" && "MISSING ENV"}
            {backendStatus === "checking" && "…"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/account">Account</Link>
        </div>

        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/shop"
            element={<Shop backendBase={BACKEND_BASE} shareId={shareId} />}
          />

          {/* ✅ THIS is the correct route for /shop/product/:shareId */}
          <Route
            path="/shop/product/:shareId"
            element={<Product backendBase={BACKEND_BASE} onPickTrack={setPlayContext} />}
          />

          <Route path="/account" element={<MyAccount backendBase={BACKEND_BASE} onPickTrack={setPlayContext} />} />
          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>

      {playerVisible && activeTrack ? (
        <BottomPlayer
          mode={mode}
          track={activeTrack}
          queue={queue}
          index={idx}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
          onPrev={() => setIdx((i) => (queue.length ? (i > 0 ? i - 1 : queue.length - 1) : 0))}
          onNext={() => setIdx((i) => (queue.length ? (i + 1) % queue.length : 0))}
          previewSeconds={30}
        />
      ) : null}
    </div>
  );
}
