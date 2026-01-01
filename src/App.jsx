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

  // Phase 0 ping
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

  // Global player state (single source of truth)
  const [activeProductId, setActiveProductId] = useState("album-001");
  const product = useMemo(() => getProduct(activeProductId), [activeProductId]);

  const tracks = product?.tracks || [];
  const [activeTrackId, setActiveTrackId] = useState(tracks[0]?.id || null);
  const activeTrack = useMemo(() => tracks.find((t) => t.id === activeTrackId) || tracks[0] || null, [tracks, activeTrackId]);

  // keep activeTrackId valid when product changes
  useEffect(() => {
    if (!tracks.length) return;
    if (!tracks.some((t) => t.id === activeTrackId)) {
      setActiveTrackId(tracks[0].id);
    }
  }, [activeProductId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 30% 20%, #0b1633 0%, #060a16 55%, #04060c 100%)" }}>
      {/* pad bottom so content doesn't hide behind player */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 110px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900, letterSpacing: 0.3 }}>
              blackout
            </div>
            <div
              style={{
                fontFamily: "system-ui",
                fontSize: 12,
                fontWeight: 900,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                opacity: 0.9,
              }}
            >
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

        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          {/* Side nav */}
          <div style={sideNav}>
            <div style={navHeader}>Public</div>
            <div style={{ display: "grid", gap: 10 }}>
              <NavLink to="/shop">Shop</NavLink>
            </div>

            <div style={{ height: 14 }} />

            <div style={navHeader}>Internal</div>
            {!isAuthed ? (
              <div style={{ color: "white", opacity: 0.65, fontFamily: "system-ui", fontSize: 12, lineHeight: 1.4 }}>
                Login to access internal pages.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <NavLink to="/account">Account</NavLink>
                <NavLink to="/tools">Export/Tools</NavLink>
              </div>
            )}
          </div>

          {/* Main */}
          <div style={{ flex: 1, minWidth: 0 }}>
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
                    <div style={{ color: "white", fontFamily: "system-ui" }}>
                      <h1 style={{ marginTop: 0 }}>Account</h1>
                      <p style={{ opacity: 0.85 }}>Phase 1 placeholder (My Collection comes next).</p>
                    </div>
                  </RequireAuth>
                }
              />

              <Route
                path="/tools"
                element={
                  <RequireAuth>
                    <div style={{ color: "white", fontFamily: "system-ui" }}>
                      <h1 style={{ marginTop: 0 }}>Export/Tools</h1>
                      <p style={{ opacity: 0.85 }}>Placeholder.</p>
                    </div>
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/shop" replace />} />
            </Routes>
          </div>
        </div>
      </div>

      {/* Global Bottom Freeze Player */}
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
        previewSeconds={30}
      />
    </div>
  );
}

const topBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 900,
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
};

const sideNav = {
  width: 220,
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 12,
  height: "fit-content",
  background: "rgba(255,255,255,0.04)",
};

const navHeader = {
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 900,
  opacity: 0.85,
  marginBottom: 10,
};
