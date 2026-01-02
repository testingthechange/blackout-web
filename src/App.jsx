// src/App.jsx
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import MyAccount from "./pages/MyAccount.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";

import BottomPlayer from "./components/BottomPlayer.jsx";

function useAuth() {
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem("authToken")));
  useEffect(() => {
    const fn = () => setIsAuthed(Boolean(localStorage.getItem("authToken")));
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
  return { isAuthed, setIsAuthed };
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const { isAuthed, setIsAuthed } = useAuth();

  // ✅ use ONE env key everywhere
  const BACKEND_BASE = String(import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");

  // backend badge
  const [backendStatus, setBackendStatus] = useState("checking");
  useEffect(() => {
    if (!BACKEND_BASE) {
      setBackendStatus("missing");
      return;
    }
    fetch(`${BACKEND_BASE}/api/health`)
      .then((res) => setBackendStatus(res.ok ? "ok" : "fail"))
      .catch(() => setBackendStatus("fail"));
  }, [BACKEND_BASE]);

  // global shell search
  const [q, setQ] = useState("");

  // ----- Player state -----
  const [playerMode, setPlayerMode] = useState("preview"); // "preview" | "full"
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // show player only on these pages (NOT home)
  const playerVisible =
    loc.pathname.startsWith("/shop") || loc.pathname.startsWith("/account") || loc.pathname.startsWith("/sold");

  const onPickTrackPreview = (track) => {
    setPlayerMode("preview");
    setActiveTrack(track);
    setIsPlaying(true);
  };

  const onPickTrackFull = (track) => {
    setPlayerMode("full");
    setActiveTrack(track);
    setIsPlaying(true);
  };

  // ✅ restore onBuy so Product never gets undefined
  const onBuy = (productId) => {
    nav(`/sold?productId=${encodeURIComponent(productId)}`);
  };

  return (
    <div style={appBg}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: playerVisible ? "14px 18px 110px" : "14px 18px 18px" }}>
        {/* Header */}
        <div style={topRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={brand}>Block Radius</div>

            <div style={badge}>
              Backend:{" "}
              {backendStatus === "checking" && "…"}
              {backendStatus === "ok" && "OK"}
              {backendStatus === "fail" && "FAIL"}
              {backendStatus === "missing" && "MISSING ENV"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isAuthed ? (
              <Link to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} style={topBtnLink}>
                Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  localStorage.removeItem("authToken");
                  setIsAuthed(false);
                  nav("/");
                }}
                style={topBtn}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* Top nav */}
        <div style={navRow}>
          <Link to="/" style={navLink(loc.pathname === "/")}>
            Home
          </Link>
          <Link to="/shop" style={navLink(loc.pathname.startsWith("/shop"))}>
            Shop
          </Link>
          <Link to="/account" style={navLink(loc.pathname.startsWith("/account"))}>
            Account
          </Link>
        </div>

        {/* Global search */}
        <div style={{ marginTop: 10, marginBottom: 16 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" style={search} />
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop q={q} onPickTrack={onPickTrackPreview} />} />

          <Route
            path="/shop/:productId"
            element={<Product q={q} onPickTrack={onPickTrackPreview} onBuy={onBuy} />}
          />

          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />

          <Route path="/account" element={<MyAccount q={q} onPickTrack={onPickTrackFull} />} />

          <Route path="*" element={<Home />} />
        </Routes>
      </div>

      {/* Bottom player (not on Home) */}
      {playerVisible ? (
        <BottomPlayer
          mode={playerMode}
          track={activeTrack}
          isPlaying={isPlaying}
          onPlayPause={(next) => setIsPlaying(Boolean(next))}
        />
      ) : null}
    </div>
  );
}

const appBg = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 25% 20%, rgba(40,60,90,0.45) 0%, rgba(10,12,16,1) 52%, rgba(6,7,9,1) 100%)",
};

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const brand = {
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 1000,
  letterSpacing: 0.4,
};

const badge = {
  fontFamily: "system-ui",
  fontSize: 12,
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  opacity: 0.9,
};

const topBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 900,
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
};

const topBtnLink = { ...topBtn, textDecoration: "none", display: "inline-block" };

const navRow = {
  marginTop: 10,
  display: "flex",
  gap: 10,
  alignItems: "center",
};

const navLink = (active) => ({
  textDecoration: "none",
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 900,
  fontSize: 12,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
  opacity: active ? 1 : 0.9,
});

const search = {
  width: "60%",
  maxWidth: 520,
  height: 44,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(20,20,20,0.55)",
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 800,
  outline: "none",
};
