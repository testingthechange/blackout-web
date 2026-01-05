import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

export default function Product({ backendBase, onPickTrack, onBuy }) {
  const { shareId } = useParams();

  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);

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
    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("Bad manifest");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setManifest(null);
        setStatus("fail");
        console.error(e);
      });
  }, [backendBase, shareId]);

  const tracks = useMemo(() => {
    if (!manifest?.ok) return [];
    return manifest.tracks.map((t, i) => ({
      id: `pub-${i}`,
      title: t.title || `Track ${i + 1}`,
      url: t.url, // BottomPlayer accepts url
    }));
  }, [manifest]);

  if (!backendBase) {
    return <ErrorPanel title="Missing backend env" details="Set VITE_ALBUM_BACKEND_URL on Render, then redeploy." />;
  }

  if (!shareId) {
    return <ErrorPanel title="Missing shareId" details="Open /shop/product/:shareId" />;
  }

  if (status === "loading") return <div style={{ padding: 16 }}>Loading product…</div>;

  if (status !== "ok") {
    return (
      <ErrorPanel
        title="Product failed to load publish manifest"
        details={`GET ${backendBase}/api/publish/${shareId}/manifest`}
      />
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Product</div>
      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 14 }}>
        ShareId: <code>{shareId}</code> · Tracks: <code>{tracks.length}</code>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Preview tracks</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tracks.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 10px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i + 1}. {t.title}
              </div>

              <button
                onClick={() => onPickTrack?.({ tracks, index: i })}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
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

        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            onClick={() => onPickTrack?.({ tracks, index: 0 })}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Play from start
          </button>

          <button
            onClick={() => onBuy?.(shareId)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}
