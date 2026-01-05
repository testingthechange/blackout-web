// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 8 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

export default function Product({ backendBase, onPickTrack }) {
  const shareId = useMemo(() => {
    const m = window.location.pathname.match(/\/shop\/product\/([^/]+)/);
    return (m?.[1] || "").trim();
  }, []);

  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

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
    setErr(null);

    fetch(`${backendBase}/api/publish/${shareId}/manifest`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("Bad manifest payload");
        return j;
      })
      .then((j) => {
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setErr(e);
        setManifest(null);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  if (status === "missing-env") {
    return <ErrorPanel title="Backend: missing env" details="Set VITE_ALBUM_BACKEND_URL in Render for blackout-web." />;
  }
  if (status === "missing-shareid") {
    return <ErrorPanel title="Missing shareId" details="Expected route: /shop/product/:shareId" />;
  }
  if (status === "fail") {
    return <ErrorPanel title="Failed to load published manifest" details={String(err?.message || err)} />;
  }
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const tracks = (manifest.tracks || []).map((t, i) => ({
    id: `pub-${i}`,
    title: t.title || `Track ${i + 1}`,
    url: t.url, // BottomPlayer reads track.url
  }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Product</div>
      <div style={{ opacity: 0.75, marginTop: 4 }}>
        ShareId: <span style={{ fontFamily: "monospace", fontWeight: 900 }}>{shareId}</span> · Tracks:{" "}
        <span style={{ fontWeight: 900 }}>{tracks.length}</span>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button
          onClick={() => onPickTrack?.({ tracks, index: 0 })}
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Play Album
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Tracks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tracks.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i + 1}. {t.title}
              </div>

              <button
                onClick={() => onPickTrack?.({ tracks, index: i })}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.10)",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Play
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
