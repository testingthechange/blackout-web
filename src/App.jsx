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

  // Optional: allow Shop to show a product card when ?shareId=... is present
  const shareIdQuery = String(searchParams.get("shareId") || "").trim();

  // ---------- BACKEND STATUS ----------
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

  // ---------- PLAYER STATE ----------
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTrack = queue[idx] || null;

  // Only show bottom player on Product + Account + Sold (NOT on /shop marketing)
  const playerVisible =
    loc.pathname.startsWith("/shop/product") ||
    loc.pathname.startsWith("/account") ||
    loc.pathname.startsWith("/sold");

  // Preview on Product, full on Account
  const playerMode = loc.pathname.startsWith("/account") ? "full" : "preview";

  const setPlayContext = ({ tracks, index }) => {
    if (!Array.isArray(tracks) || !tracks.length) return;
    setQueue(tracks);
    setIdx(Math.max(0, Number(index || 0)));
    setIsPlaying(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0c10", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 18px 120px" }}>
        {/* HEADER */}
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

        {/* NAV */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/account">Account</Link>
        </div>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/shop"
            element={<Shop backendBase={BACKEND_BASE} shareId={shareIdQuery} />}
          />

          {/* CANONICAL PRODUCT ROUTE */}
          <Route
            path="/shop/product/:shareId"
            element={
              <Product
                backendBase={BACKEND_BASE}
                onPickTrack={(ctx) => setPlayContext(ctx)}
                onBuy={(sid) => nav(`/sold?productId=${encodeURIComponent(sid)}`)}
              />
            }
          />

          <Route path="/account" element={<MyAccount backendBase={BACKEND_BASE} />} />
          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>

      {playerVisible && activeTrack ? (
        <BottomPlayer
          mode={playerMode}
          track={activeTrack}
          queue={queue}
          index={idx}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
          onPrev={() => setIdx((i) => (i > 0 ? i - 1 : queue.length - 1))}
          onNext={() => setIdx((i) => (i + 1) % queue.length)}
          // previewSeconds only matters in preview mode
          previewSeconds={30}
        />
      ) : null}
    </div>
  );
}
