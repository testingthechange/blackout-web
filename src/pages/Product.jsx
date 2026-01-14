import { useEffect, useMemo, useState } from "react";

export default function Product({ backendBase: backendBaseProp, shareId: shareIdProp }) {
  const backendBase = (backendBaseProp || import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");
  const shareId = useMemo(() => String(shareIdProp || "").trim(), [shareIdProp]);

  const [status, setStatus] = useState("idle");
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
    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((j) => {
        if (!j?.ok) throw new Error("manifest not ok");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  if (status === "missing-env") return <div style={{ padding: 24 }}>Missing backend env</div>;
  if (status === "missing-shareid") return <div style={{ padding: 24 }}>Missing shareId</div>;
  if (status === "fail") return <div style={{ padding: 24 }}>{String(err)}</div>;
  if (!manifest) return <div style={{ padding: 24 }}>Loading…</div>;

  const albumTitle = manifest?.album?.title || "Album";
  const artist = manifest?.album?.artist || "";
  const releaseDate = manifest?.album?.releaseDate || "";
  const priceText = "$18.50";

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr", // ✅ column one wider
          gap: 20,
          maxWidth: 1200,
        }}
      >
        {/* LEFT COLUMN (content placeholder) */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 16,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
            Tracklist / Content
          </div>
          <div style={{ opacity: 0.7 }}>
            (Tracks, previews, details will live here)
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* TOP CARD — META */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 16,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18 }}>{albumTitle}</div>
            {artist && <div style={{ opacity: 0.85, marginTop: 4 }}>{artist}</div>}
            {releaseDate && (
              <div style={{ opacity: 0.6, fontSize: 12, marginTop: 6 }}>
                Released {releaseDate}
              </div>
            )}
          </div>

          {/* MIDDLE CARD — BUY */}
          <div
            style={{
              border: "1px solid rgba(34,197,94,0.55)",
              borderRadius: 16,
              padding: 16,
              background: "rgba(34,197,94,0.15)",
            }}
          >
            <button
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: 14,
                border: "none",
                background: "rgb(34,197,94)",
                color: "#022c22",
                fontWeight: 900,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              BUY {priceText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
