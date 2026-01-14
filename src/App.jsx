// src/App.jsx
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";

import BottomPlayer from "./components/BottomPlayer.jsx";

const BACKEND_BASE = (import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status} ${url}`);
  return j;
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // ---- SHARE ID (querystring-first, canonical) ----
  const queryShareId = String(searchParams.get("shareId") || "").trim();

  const routeShareId = useMemo(() => {
    const m = loc.pathname.match(/^\/shop\/product\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : "";
  }, [loc.pathname]);

  const activeShareId = routeShareId || queryShareId;

  // ---- BACKEND STATUS ----
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

  // ---- PLAYER STATE ----
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerMode, setPlayerMode] = useState("album");

  const activeTrack = queue[idx] || null;

  const onProductPage =
    loc.pathname.startsWith("/product") || loc.pathname.startsWith("/shop/product");

  const playerVisible = onProductPage;

  const signedCache = useMemo(() => new Map(), []);

  async function signTrackIfNeeded(track) {
    if (!track) return null;
    if (track.url) return track;

    const s3Key = String(track.s3Key || "").trim();
    if (!s3Key) return track;

    if (signedCache.has(s3Key)) {
      return { ...track, url: signedCache.get(s3Key) };
    }

    const j = await fetchJson(`${BACKEND_BASE}/api/playback-url?s3Key=${encodeURIComponent(s3Key)}`);
    if (!j?.url) throw new Error("Failed to sign playback url");

    signedCache.set(s3Key, j.url);
    return { ...track, url: j.url };
  }

  async function setPlayContext({ tracks, index = 0, mode = "album" }) {
    if (!Array.isArray(tracks) || !tracks.length) return;

    const i = Math.max(0, Math.min(Number(index || 0), tracks.length - 1));
    const t = await signTrackIfNeeded(tracks[i]);

    setQueue(tracks.map((x, k) => (k === i ? t : x)));
    setIdx(i);
    setIsPlaying(true);

    if (mode === "album" || mode === "smartBridge") setPlayerMode(mode);
  }

  async function goPrev() {
    if (!queue.length) return;
    const next = (idx - 1 + queue.length) % queue.length;
    const t = await signTrackIfNeeded(queue[next]);
    setQueue(queue.map((x, i) => (i === next ? t : x)));
    setIdx(next);
    setIsPlaying(true);
  }

  async function goNext() {
    if (!queue.length) return;
    const next = (idx + 1) % queue.length;
    const t = await signTrackIfNeeded(queue[next]);
    setQueue(queue.map((x, i) => (i === next ? t : x)));
    setIdx(next);
    setIsPlaying(true);
  }

  const shopHref = `/shop${activeShareId ? `?shareId=${encodeURIComponent(activeShareId)}` : ""}`;

  return (
    <div style={{ minHeight: "100vh", background: "#111827", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 120px" }}>
        {/* HEADER */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "start" }}>
          <div style={{ fontWeight: 900 }}>Block Radius</div>

          <div style={{ display: "flex", gap: 18, justifyContent: "center" }}>
            <Link to="/" style={navLink}>
              Home
            </Link>
            <Link to={shopHref} style={navLink}>
              Shop
            </Link>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link to="/login" style={loginLink}>
              Login
            </Link>
          </div>
        </div>

        {/* STATUS */}
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Backend: {String(backendStatus).toUpperCase()} · ShareId: {activeShareId || "—"}
        </div>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop backendBase={BACKEND_BASE} shareId={activeShareId} />} />

          {/* /product?shareId=... */}
          <Route
            path="/product"
            element={<Product backendBase={BACKEND_BASE} shareId={activeShareId} onPickTrack={setPlayContext} />}
          />

          {/* legacy support */}
          <Route
            path="/shop/product/:shareId"
            element={<Product backendBase={BACKEND_BASE} shareId={activeShareId} onPickTrack={setPlayContext} />}
          />

          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>

      {/* PLAYER (FIXED: show placeholder bar when no activeTrack) */}
      {playerVisible ? (
        activeTrack?.url ? (
          <BottomPlayer
            mode={playerMode}
            track={activeTrack}
            queue={queue}
            index={idx}
            isPlaying={isPlaying}
            onPlayPause={setIsPlaying}
            onPrev={goPrev}
            onNext={goNext}
            previewSeconds={30}
          />
        ) : (
          <div
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              height: 86,
              background: "rgba(0,0,0,0.35)",
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.75)",
              fontWeight: 900,
            }}
          >
            Select a track to play
          </div>
        )
      ) : null}
    </div>
  );
}

const navLink = {
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
};

const loginLink = {
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
};
