import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";
import MyAccount from "./pages/MyAccount.jsx";

import BottomPlayer from "./components/BottomPlayer.jsx";
import { getProduct } from "./data/catalog.js";

function useAuth() {
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem("authToken")));
  useEffect(() => {
    const fn = () => setIsAuthed(Boolean(localStorage.getItem("authToken")));
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
  return { isAuthed, setIsAuthed };
}

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return children;
}

function TopNav() {
  const loc = useLocation();

  const item = (to, label) => {
    const active = loc.pathname === to || (to === "/shop" && loc.pathname.startsWith("/shop"));
    return (
      <Link
        to={to}
        style={{
          textDecoration: "none",
          color: "white",
          fontFamily: "system-ui",
          fontWeight: 950,
          fontSize: 12,
          padding: "8px 10px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.14)",
          background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
          opacity: active ? 1 : 0.88,
        }}
      >
        {label}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {item("/", "Home")}
      {item("/shop", "Shop")}
      {item("/account", "Account")}
    </div>
  );
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const { isAuthed, setIsAuthed } = useAuth();

  // ✅ Player behavior is page-based:
  // - Shop/Product = preview mode (30s)
  // - Account = full mode
  const playerMode = loc.pathname.startsWith("/account") ? "full" : "preview";

  // Global search UI (same on all pages). Not wired to filtering yet.
  const [globalSearch, setGlobalSearch] = useState("");

  // Phase 0 ping
  const [backendStatus, setBackendStatus] = useState("checking");
  useEffect(() => {
    const base = import.meta.env.VITE_ALBUM_BACKEND_URL;
    if (!base) return setBackendStatus("missing");
    fetch(`${base}/api/health`)
      .then((res) => setBackendStatus(res.ok ? "ok" : "fail"))
      .catch(() => setBackendStatus("fail"));
  }, []);

  // Global player state (single source of truth)
  const [activeProductId, setActiveProductId] = useState("album-001");
  const product = useMemo(() => getProduct(activeProductId), [activeProductId]);

  const tracks = product?.tracks || [];
  const [activeTrackId, setActiveTrackId] = useState(tracks[0]?.id || null);
  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) || tracks[0] || null,
    [tracks, activeTrackId]
  );

  // keep activeTrackId valid when product changes
  useEffect(() => {
    if (!tracks.length) return;
    if (!tracks.some((t) => t.id === activeTrackId)) setActiveTrackId(tracks[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const onPrev = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === activeTrackId);
    const prevIdx = idx <= 0 ? tracks.length - 1 : idx - 1;
    setActiveTrackId(tracks[prevIdx].id);
    setIsPlaying(true);
  };

  const onNext = () => {
    if (!tracks.length) return;

    if (shuffle) {
      const other = tracks.filter((t) => t.id !== activeTrackId);
      const pick = other[Math.floor(Math.random() * other.length)] || tracks[0];
      setActiveTrackId(pick.id);
      setIsPlaying(true);
      return;
    }

    const idx = tracks.findIndex((t) => t.id === activeTrackId);
    const nextIdx = idx >= tracks.length - 1 ? 0 : idx + 1;
    setActiveTrackId(tracks[nextIdx].id);
    setIsPlaying(true);
  };

  const onBuy = (productId) => {
    setActiveProductId(productId);
    nav(`/sold?productId=${encodeURIComponent(productId)}`);
  };

  // ✅ Account -> App play bridge
  useEffect(() => {
    const handler = (e) => {
      const d = e?.detail || {};
      if (d.productId) setActiveProductId(String(d.productId));
      if (d.trackId) setActiveTrackId(String(d.trackId));
      setIsPlaying(true);
    };
    window.addEventListener("blackout:play", handler);
    return () => window.removeEventListener("blackout:play", handler);
  }, []);

  return (
    <div style={bg}>
      {/* pad bottom so content doesn't hide behind player */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 16px 140px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 1000, letterSpacing: 0.2 }}>
              Block Radius
            </div>

            <TopNav />

            <div style={badge}>
              Backend:{" "}
              {backendStatus === "checking" && "…"}
              {backendStatus === "ok" && "OK"}
              {backendStatus === "fail" && "FAIL"}
              {backendStatus === "missing" && "MISSING ENV"}
            </div>
          </div>

          {!isAuthed ? (
            <button
              onClick={() => nav(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`)}
              style={topBtn}
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                setIsAuthed(false);
                nav("/shop");
              }}
              style={topBtn}
            >
              Logout
            </button>
          )}
        </div>

        {/* Global search (under login area, same everywhere) */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <input
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search"
            style={globalSearchInput}
          />
        </div>

        {/* Main content */}
        <div style={{ marginTop: 14 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/shop" replace />} />
            <Route path="/shop" element={<Shop />} />
            <Route
              path="/shop/:productId"
              element={
                <Product
                  activeTrackId={activeTrackId}
                  setActiveTrackId={(id) => {
                    setActiveTrackId(id);
                    setIsPlaying(true);
                  }}
                  onBuy={onBuy}
                />
              }
            />
            <Route path="/sold" element={<Sold />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/account"
              element={
                <RequireAuth>
                  <MyAccount />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/shop" replace />} />
          </Routes>
        </div>
      </div>

      {/* Bottom Freeze Player (UI same, behavior by page mode) */}
      <BottomPlayer
        track={activeTrack}
        isPlaying={isPlaying}
        onPlayPause={(next) => setIsPlaying(Boolean(next))}
        onPrev={onPrev}
        onNext={onNext}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle((v) => !v)}
        repeat={repeat}
        onToggleRepeat={() => setRepeat((v) => !v)}
        mode={playerMode}     // ✅ "preview" on shop, "full" on account
        previewSeconds={30}
      />
    </div>
  );
}

const bg = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 30% 20%, rgba(12,22,40,1) 0%, rgba(8,10,16,1) 55%, rgba(6,7,10,1) 100%)",
};

const topBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 950,
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
};

const badge = {
  fontFamily: "system-ui",
  fontSize: 12,
  fontWeight: 950,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  opacity: 0.9,
};

const globalSearchInput = {
  width: "320px",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
  fontSize: 13,
  fontWeight: 900,
};
