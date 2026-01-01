import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";
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

function NavLink({ to, children }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      style={{
        display: "block",
        textDecoration: "none",
        color: "white",
        fontFamily: "system-ui",
        fontWeight: 900,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        opacity: active ? 1 : 0.82,
      }}
    >
      {children}
    </Link>
  );
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const { isAuthed, setIsAuthed } = useAuth();

  // Search (global, same size/location)
  const [searchQuery, setSearchQuery] = useState("");

  // Backend ping
  const [backendStatus, setBackendStatus] = useState("checking");
  useEffect(() => {
    const base = import.meta.env.VITE_ALBUM_BACKEND_URL;
    if (!base) {
      setBackendStatus("missing");
      return;
    }
    fetch(`${base}/api/health`)
      .then((res) => setBackendStatus(res.ok ? "ok" : "fail"))
      .catch(() => setBackendStatus("fail"));
  }, []);

  // Global player state
  const [activeProductId, setActiveProductId] = useState("album-001");
  const product = useMemo(() => getProduct(activeProductId), [activeProductId]);

  const tracks = product?.tracks || [];
  const [activeTrackId, setActiveTrackId] = useState(tracks[0]?.id || null);
  const activeTrack = useMemo(
    () => tracks.find((t) => t.id === activeTrackId) || tracks[0] || null,
    [tracks, activeTrackId]
  );

  useEffect(() => {
    if (!tracks.length) return;
    if (!tracks.some((t) => t.id === activeTrackId)) {
      setActiveTrackId(tracks[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProductId]);

  const [isPlaying, setIsPlaying] = useState(false);

  const onPrev = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === activeTrackId);
    const prevIdx = idx <= 0 ? tracks.length - 1 : idx - 1;
    setActiveTrackId(tracks[prevIdx].id);
    setIsPlaying(true);
  };

  const onNext = () => {
    if (!tracks.length) return;
    const idx = tracks.findIndex((t) => t.id === activeTrackId);
    const nextIdx = idx >= tracks.length - 1 ? 0 : idx + 1;
    setActiveTrackId(tracks[nextIdx].id);
    setIsPlaying(true);
  };

  const onBuy = (productId) => {
    setActiveProductId(productId);
    nav(`/sold?productId=${encodeURIComponent(productId)}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 30% 20%, #0b1633 0%, #060a16 55%, #04060c 100%)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 110px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900 }}>
              Block Radius
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
              }}
            >
              Backend:{" "}
              {backendStatus === "checking" && "…"}
              {backendStatus === "ok" && "OK"}
              {backendStatus === "fail" && "FAIL"}
              {backendStatus === "missing" && "MISSING ENV"}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
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

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              style={searchInput}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          {/* Side nav */}
          <div style={sideNav}>
            <div style={navHeader}>Public</div>
            <NavLink to="/shop">Shop</NavLink>
          </div>

          {/* Main */}
          <div style={{ flex: 1 }}>
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
              <Route path="*" element={<Navigate to="/shop" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      <BottomPlayer
        track={activeTrack}
        isPlaying={isPlaying}
        onPlayPause={(next) => setIsPlaying(Boolean(next))}
        onPrev={onPrev}
        onNext={onNext}
        previewSeconds={30}
      />
    </div>
  );
}

const topBtn = {
  width: 140,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const searchInput = {
  width: 420,
  height: 44,
  padding: "0 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 800,
  outline: "none",
};

const sideNav = {
  width: 220,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(255,255,255,0.04)",
};

const navHeader = {
  fontWeight: 900,
  opacity: 0.85,
  marginBottom: 10,
};
