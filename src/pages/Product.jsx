// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

export default function Product({ backendBase, onPickTrack, onBuy }) {
  const shareId = useMemo(() => {
    const m = window.location.pathname.match(/\/shop\/product\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }, []);

  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      return;
    }
    if (!shareId) {
      setStatus("missing-shareid");
      return;
    }

    setStatus("loading");
    setErr(null);

    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) {
          throw new Error(j?.error || `HTTP ${r.status}`);
        }
        return j;
      })
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("manifest missing tracks");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setManifest(null);
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;

  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;

  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;

  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const tracks = manifest.tracks.map((t, i) => ({
    id: `trk-${i}`,
    title: t.title,
    s3Key: t.s3Key,
  }));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Product</div>
      <div style={{ opacity: 0.8, marginTop: 4 }}>
        ShareId: <code>{shareId}</code>
      </div>

      <div style={{ marginTop: 14, fontWeight: 900 }}>Tracks</div>
      <div style={{ marginTop: 8 }}>
        {tracks.map((t, i) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
            <div style={{ width: 24, opacity: 0.7 }}>{i + 1}</div>
            <div style={{ flex: 1, fontWeight: 800 }}>{t.title || "Untitled"}</div>
            <button
              onClick={() => onPickTrack({ tracks, index: i })}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ▶ Play
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => onBuy?.(shareId)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.14)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Buy
        </button>
      </div>
    </div>
  );
}
