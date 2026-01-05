// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BottomPlayer from "../components/BottomPlayer.jsx";

function safeStr(v) {
  return String(v ?? "").trim();
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

export default function Product({ backendBase, onBuy }) {
  const params = useParams();
  const shareId = safeStr(params.shareId);

  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);

  // player state (Product = preview)
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // load manifest (published artifact)
  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!shareId) {
      setStatus("missing-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");
    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("bad manifest");
        setManifest(j);
        setStatus("ok");
      })
      .catch(() => {
        setManifest(null);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  // build queue as (title + s3Key). DO NOT trust cached URLs (they expire).
  useEffect(() => {
    if (!manifest?.ok) {
      setQueue([]);
      setIdx(0);
      setIsPlaying(false);
      return;
    }

    const tracks = (manifest.tracks || []).map((t, i) => ({
      id: `pub-${shareId}-${i}`,
      title: safeStr(t?.title) || `Track ${i + 1}`,
      s3Key: safeStr(t?.s3Key),
      url: "", // filled on-demand via /api/playback-url
    }));

    setQueue(tracks);
    setIdx(0);
    setIsPlaying(false);
  }, [manifest, shareId]);

  // ensure the active track has a fresh URL before attempting playback
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!backendBase) return;
      const t = queue[idx];
      if (!t) return;
      if (!t.s3Key) return;

      // already have a URL → keep it
      if (t.url) return;

      try {
        const playback = await fetchJson(
          `${backendBase}/api/playback-url?s3Key=${encodeURIComponent(t.s3Key)}`
        );

        const url = safeStr(playback?.url);
        if (!url) throw new Error("missing playback url");

        if (!alive) return;
        setQueue((prev) =>
          (prev || []).map((x, i) => (i === idx ? { ...x, url } : x))
        );
      } catch {
        // If we can't get a fresh URL, stop playback
        if (!alive) return;
        setIsPlaying(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [backendBase, queue, idx]);

  const activeTrack = queue[idx] || null;

  const canBuy = status === "ok" && !!shareId;

  return (
    <div style={{ paddingBottom: 120 }}>
      <h1 style={{ margin: 0 }}>Product</h1>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
        Publish: {status.toUpperCase()} · ShareId:{" "}
        <span style={{ fontFamily: "monospace", fontWeight: 900 }}>{shareId || "—"}</span>
      </div>

      {status === "fail" ? <div style={{ marginTop: 14 }}>Failed to load manifest.</div> : null}
      {status === "missing-env" ? <div style={{ marginTop: 14 }}>Missing VITE_ALBUM_BACKEND_URL.</div> : null}

      {status === "ok" ? (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid rgba(255,255,255,0.16)", borderRadius: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Tracks</div>

          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {queue.map((t, i) => (
              <li key={t.id} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => {
                    setIdx(i);
                    setIsPlaying(true);
                  }}
                  style={{
                    cursor: "pointer",
                    background: "transparent",
                    color: "white",
                    border: "none",
                    padding: 0,
                    fontWeight: i === idx ? 900 : 700,
                    textDecoration: i === idx ? "underline" : "none",
                  }}
                >
                  {t.title}
                </button>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 14 }}>
            <button
              disabled={!canBuy}
              onClick={() => onBuy?.(shareId)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                background: canBuy ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                color: "white",
                fontWeight: 900,
                cursor: canBuy ? "pointer" : "not-allowed",
              }}
            >
              Buy (next)
            </button>
          </div>
        </div>
      ) : null}

      {/* Product owns playback (preview only) */}
      {activeTrack ? (
        <BottomPlayer
          mode="preview"
          track={activeTrack}
          queue={queue}
          index={idx}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
          onPrev={() => setIdx((i) => (i > 0 ? i - 1 : queue.length - 1))}
          onNext={() => setIdx((i) => (i + 1) % queue.length)}
          previewSeconds={30}
        />
      ) : null}
    </div>
  );
}
