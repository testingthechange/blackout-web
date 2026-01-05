// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

async function fetchManifest({ backendBase, shareId }) {
  const url = `${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  const j = await res.json();
  if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("Manifest invalid");
  return j;
}

export default function Product({ backendBase, onPickTrack, onBuy }) {
  const params = useParams();
  const shareId = useMemo(() => String(params.shareId || "").trim(), [params.shareId]);

  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setErr("");
      setManifest(null);

      if (!backendBase) {
        setStatus("missing-env");
        return;
      }
      if (!shareId) {
        setStatus("missing-shareid");
        return;
      }

      setStatus("loading");
      try {
        const j = await fetchManifest({ backendBase, shareId });
        if (!alive) return;
        setManifest(j);
        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        setErr(String(e?.message || e));
        setStatus("fail");
      }
    })();

    return () => {
      alive = false;
    };
  }, [backendBase, shareId]);

  if (!backendBase) {
    return <ErrorPanel title="Missing backend env" details="Set VITE_API_BASE in blackout-web Render env." />;
  }

  if (!shareId) {
    return <ErrorPanel title="Missing shareId" details="Route should be /shop/product/:shareId" />;
  }

  if (status === "loading") return <div style={{ padding: 16 }}>Loading…</div>;

  if (status === "fail") {
    return <ErrorPanel title="Product failed to load published manifest" details={err || "Unknown error"} />;
  }

  if (!manifest?.ok) {
    return <ErrorPanel title="Manifest not available" details={`Status: ${status}`} />;
  }

  const tracks = manifest.tracks.map((t, i) => ({
    id: `pub-${manifest.shareId}-${i}`,
    title: String(t.title || `Track ${i + 1}`),
    url: String(t.url || ""),
    s3Key: String(t.s3Key || ""),
    slot: t.slot,
  }));

  const albumTitle = "Published Album";
  const artist = "Smart Bridge";

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{albumTitle}</div>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>{artist}</div>

      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
        ShareId: <code>{manifest.shareId}</code> · ProjectId: <code>{manifest.projectId}</code> · Tracks:{" "}
        <code>{tracks.length}</code>
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => onPickTrack?.({ tracks, index: 0 })}
          style={{ padding: "10px 14px", fontWeight: 900, cursor: "pointer" }}
        >
          Play Album
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Tracks</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tracks.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i + 1}. {t.title}
              </div>
              <button
                onClick={() => onPickTrack?.({ tracks, index: i })}
                style={{ padding: "8px 12px", fontWeight: 900, cursor: "pointer" }}
              >
                Play
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => onBuy?.(manifest.shareId)}
          style={{ padding: "10px 14px", fontWeight: 900, cursor: "pointer" }}
        >
          Buy
        </button>
      </div>
    </div>
  );
}
