// src/App.jsx
import { Routes, Route, Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import Product from "./pages/Product.jsx";
import MyAccount from "./pages/MyAccount.jsx";
import Sold from "./pages/Sold.jsx";
import Login from "./pages/Login.jsx";

import BottomPlayer from "./components/BottomPlayer.jsx";

const BACKEND_BASE = (import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return await r.json();
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const shareId = String(searchParams.get("shareId") || "").trim();

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
  const [queue, setQueue] = useState([]); // each track: { title, s3Key, url? }
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTrack = queue[idx] || null;

  const playerVisible =
    loc.pathname.startsWith("/shop") ||
    loc.pathname.startsWith("/account") ||
    loc.pathname.startsWith("/sold");

  // Cache signed urls briefly per s3Key so rapid prev/next feels instant
  const signedCache = useMemo(() => new Map(), []);

  async function signTrackIfNeeded(track) {
    if (!track) return null;
    const s3Key = String(track.s3Key || "").trim();
    if (!s3Key) return track;

    // if already has url, keep it
    if (track.url) return track;

    if (!BACKEND_BASE) throw new Error("Missing backend env");

    // cache hit
    if (signedCache.has(s3Key)) {
      return { ...track, url: signedCache.get(s3Key) };
    }

    const j = await fetchJson(`${BACKEND_BASE}/api/playback-url?s3Key=${encodeURIComponent(s3Key)}`);
    if (!j?.ok || !j.url) throw new Error("Failed to sign playback url");
    signedCache.set(s3Key, j.url);
    return { ...track, url: j.url };
  }

  // Called by pages when user clicks play (user gesture)
  async function setPlayContext({ tracks, index }) {
    if (!Array.isArray(tracks) || !tracks.length) return;

    const i = Math.max(0, Math.min(Number(index || 0), tracks.length - 1));
    const t = await signTrackIfNeeded(tracks[i]);

    // ensure queue entry at i contains url
    const nextQueue = tracks.map((x, k) => (k === i ? t : x));
    setQueue(nextQueue);
    setIdx(i);
    setIsPlaying(true);
  }

  async function goPrev() {
    if (!queue.length) return;
    const nextI = idx > 0 ? idx - 1 : queue.length - 1;
    const t = await signTrackIfNeeded(queue[nextI]);
    const nextQueue = queue.map((x, k) => (k === nextI ? t : x));
    setQueue(nextQueue);
    setIdx(nextI);
    setIsPlaying(true);
  }

  async function goNext() {
    if (!queue.length) return;
    const nextI = (idx + 1) % queue.length;
    const t = await signTrackIfNeeded(queue[nextI]);
    const nextQueue = queue.map((x, k) => (k === nextI ? t : x));
    setQueue(nextQueue);
    setIdx(nextI);
    setIsPlaying(true);
  }

  const playerMode = useMemo(() => {
    // Shop/Product => preview; Account => full
    if (loc.pathname.startsWith("/account")) return "full";
    if (loc.pathname.startsWith("/shop")) return "preview";
    return "preview";
  }, [loc.pathname]);

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
            {" · "}
            ShareId: {shareId || "—"}
          </div>
        </div>

        {/* NAV */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <Link to="/">Home</Link>
          <Link to={`/shop${shareId ? `?shareId=${encodeURIComponent(shareId)}` : ""}`}>Shop</Link>
          <Link to={`/account${shareId ? `?shareId=${encodeURIComponent(shareId)}` : ""}`}>Account</Link>
        </div>

        {/* ROUTES */}
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/shop"
            element={<Shop backendBase={BACKEND_BASE} shareId={shareId} onPickTrack={setPlayContext} />}
          />

          <Route
            path="/shop/product/:shareId"
            element={
              <Product
                backendBase={BACKEND_BASE}
                onPickTrack={setPlayContext}
                onBuy={(id) => nav(`/sold?productId=${encodeURIComponent(id)}`)}
              />
            }
          />

          <Route path="/account" element={<MyAccount backendBase={BACKEND_BASE} shareId={shareId} />} />
          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>

      {playerVisible && activeTrack?.url ? (
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
      ) : null}
    </div>
  );
}
