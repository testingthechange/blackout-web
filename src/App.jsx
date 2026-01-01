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

function TopNavLink({ to, children }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== "/" && loc.pathname.startsWith(to));
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "white",
        fontFamily: "system-ui",
        fontWeight: 900,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        opacity: active ? 1 : 0.86,
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
    <div style={page}>
      {/* subtle gradient filter overlay */}
      <div style={bgOverlay} />

      <div style={{ position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 110px" }}>
          {/* Top bar */}
          <div style={topBar}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={brand}>Block Radius</div>

              <div style={{ display: "flex", gap: 10 }}>
                <TopNavLink to="/">Home</TopNavLink>
                <TopNavLink to="/shop">Shop</TopNavLink>
                <TopNavLink to="/account">Account</TopNavLink>
              </div>

              <div style={backendPill}>
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

          {/* Main */}
          <div style={{ marginTop: 16 }}>
            <Routes>
              <Route
                path="/"
                element={
                  <div style={pageCard}>
                    <h1 style={{ marginTop: 0, marginBottom: 8, fontFamily: "system-ui", color: "white" }}>Home</h1>
                    <div style={{ color: "white", opacity: 0.78, fontFamily: "system-ui" }}>
                      Phase 1 placeholder.
                    </div>
                  </div>
                }
              />

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
                    <div style={pageCard}>
                      <h1 style={{ marginTop: 0, marginBottom: 8, fontFamily: "system-ui", color: "white" }}>
                        Account
                      </h1>
                      <div style={{ color: "white", opacity: 0.78, fontFamily: "system-ui" }}>
                        Phase 1 placeholder.
                      </div>
                    </div>
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/shop" replace />} />
            </Routes>
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
    </div>
  );
}

const page = {
  minHeight: "100vh",
  background: "#0b0d10", // darker grey base
  position: "relative",
};

const bgOverlay = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(1200px 700px at 18% 10%, rgba(90,120,255,0.12), transparent 60%), radial-gradient(900px 600px at 85% 35%, rgba(40,220,150,0.08), transparent 55%), radial-gradient(900px 700px at 45% 95%, rgba(210,80,255,0.07), transparent 60%)",
  filter: "blur(0px)",
  opacity: 1,
};

const topBar = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
};

const brand = {
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 950,
  letterSpacing: 0.2,
  marginRight: 8,
  whiteSpace: "nowrap",
};

const backendPill = {
  fontFamily: "system-ui",
  fontSize: 12,
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  opacity: 0.95,
  whiteSpace: "nowrap",
  alignSelf: "center",
};

const topBtn = {
  width: 140,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "system-ui",
};

const searchInput = {
  width: 420,
  height: 44,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 800,
  outline: "none",
  fontFamily: "system-ui",
};

const pageCard = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.04)",
};
