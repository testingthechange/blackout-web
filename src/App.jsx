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
  const [searchParams, setSearchParams] = useSearchParams();

  // shareId from querystring (?shareId=...)
  const shareId = String(searchParams.get("shareId") || "").trim();
  const qParam = String(searchParams.get("q") || "").trim();

  // shareId from route (/shop/product/:shareId)
  const routeShareId = useMemo(() => {
    const m = loc.pathname.match(/^\/shop\/product\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : "";
  }, [loc.pathname]);

  const activeShareId = routeShareId || shareId;

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

  // ---------- GLOBAL SEARCH ----------
  const [searchDraft, setSearchDraft] = useState(qParam);
  useEffect(() => setSearchDraft(qParam), [qParam]);

  function updateQueryParam(nextQ) {
    const next = new URLSearchParams(searchParams);
    if (nextQ) next.set("q", nextQ);
    else next.delete("q");
    setSearchParams(next, { replace: true });
  }

  // ---------- PLAYER STATE ----------
  const [queue, setQueue] = useState([]); // each track: { title, s3Key, url? }
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeTrack = queue[idx] || null;

  // SHOW PLAYER on Product + Account (layout locked requirement)
  const playerVisible =
    loc.pathname.startsWith("/shop/product") ||
    loc.pathname.startsWith("/account");

  // Cache signed urls briefly per s3Key
  const signedCache = useMemo(() => new Map(), []);

  async function signTrackIfNeeded(track) {
    if (!track) return null;
    const s3Key = String(track.s3Key || "").trim();
    if (!s3Key) return track;

    if (track.url) return track;
    if (!BACKEND_BASE) throw new Error("Missing backend env");

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

  // preview for now
  const playerMode = "preview";

  const shopHref = `/shop${shareId ? `?shareId=${encodeURIComponent(shareId)}` : ""}${
    qParam ? `${shareId ? "&" : "?"}q=${encodeURIComponent(qParam)}` : ""
  }`;
  const accountHref = `/account${shareId ? `?shareId=${encodeURIComponent(shareId)}` : ""}${
    qParam ? `${shareId ? "&" : "?"}q=${encodeURIComponent(qParam)}` : ""
  }`;

  return (
    <div style={{ minHeight: "100vh", background: "#111827", color: "white" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 120px" }}>
        {/* HEADER */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "start", gap: 12 }}>
          <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>Block Radius</div>

          <div style={{ display: "flex", justifyContent: "center", gap: 18, paddingTop: 2 }}>
            <Link to="/" style={navLink}>Home</Link>
            <Link to={shopHref} style={navLink}>Shop</Link>
            <Link to={accountHref} style={navLink}>Account</Link>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 320 }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link to="/login" style={loginLink}>Login</Link>
              </div>

              {/* GLOBAL SEARCH */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateQueryParam(String(searchDraft || "").trim());
                  if (!loc.pathname.startsWith("/shop")) nav("/shop" + window.location.search);
                }}
                style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  placeholder="Search"
                  style={searchInput}
                />
                <button type="submit" style={searchBtn}>Search</button>
              </form>
            </div>
          </div>
        </div>

        {/* STATUS ROW */}
        <div style={statusRow}>
          <div>
            Backend:{" "}
            {backendStatus === "ok" && "OK"}
            {backendStatus === "fail" && "FAIL"}
            {backendStatus === "missing" && "MISSING ENV"}
            {backendStatus === "checking" && "…"}
          </div>
          <div>ShareId: {activeShareId || "—"}</div>
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
          <Route
            path="/account"
            element={<MyAccount backendBase={BACKEND_BASE} shareId={shareId} onPickTrack={setPlayContext} />}
          />
          <Route path="/sold" element={<Sold />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>

      {/* PLAYER: shown on Product + Account */}
      {playerVisible ? (
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

const navLink = {
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  opacity: 0.9,
};

const loginLink = {
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
};

const statusRow = {
  marginTop: 10,
  display: "flex",
  justifyContent: "center",
  gap: 16,
  fontSize: 12,
  opacity: 0.8,
};

const searchInput = {
  width: 220,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  outline: "none",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 800,
};

const searchBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(34,197,94,0.55)",
  background: "rgba(34,197,94,0.20)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};
