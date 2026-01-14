// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";

export default function Product({ backendBase: backendBaseProp, shareId: shareIdProp, onPickTrack }) {
  const backendBase = (backendBaseProp || import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");
  const shareId = useMemo(() => String(shareIdProp || "").trim(), [shareIdProp]);

  const [status, setStatus] = useState("idle"); // idle | missing-env | missing-shareid | loading | ok | fail
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
        setManifest(null);
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  // ---- normalize tracks for BottomPlayer ----
  const tracks = useMemo(() => {
    const src = manifest?.tracks || manifest?.album?.tracks || [];
    if (!Array.isArray(src)) return [];
    return src
      .map((t) => ({
        title: t.title || `Track ${t.slot ?? ""}`.trim(),
        // BottomPlayer supports track.url OR track.audioUrl
        audioUrl: t.audioUrl || "",
        url: t.url || "", // keep if backend ever returns url directly
        // keep keys if you ever want signing later
        audioKey: t.audioKey || "",
        s3Key: t.s3Key || "",
        durationSec: Number(t.durationSec || 0),
      }))
      .filter((t) => t.audioUrl || t.url || t.s3Key || t.audioKey);
  }, [manifest]);

  // Optional: auto-start first track when manifest loads (comment out if you don’t want autoplay)
  useEffect(() => {
    if (status !== "ok") return;
    if (!tracks.length) return;
    if (typeof onPickTrack !== "function") return;
    onPickTrack({ tracks, index: 0, mode: "album" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tracks.length]);

  if (status === "missing-env") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Product</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>Missing backend env (VITE_ALBUM_BACKEND_URL).</div>
      </div>
    );
  }

  if (status === "missing-shareid") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Product</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          Missing shareId. Add <code>?shareId=...</code>.
        </div>
      </div>
    );
  }

  if (status === "fail") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Product</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid rgba(255,0,0,0.45)", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Failed to load product</div>
          <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{String(err?.message || err)}</div>
        </div>
      </div>
    );
  }

  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const albumName = String(manifest?.albumName || manifest?.album?.title || "Album");
  const performers = String(manifest?.performers || manifest?.album?.artist || "");
  const description = String(manifest?.productDescription || "Digital album access tied to published snapshot.");
  const priceText = String(manifest?.priceText || "$9.99");

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Product</div>
      <div style={{ opacity: 0.85, marginBottom: 14 }}>
        {albumName}
        {performers ? ` — ${performers}` : ""}
      </div>

      {/* two-column card layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 980 }}>
        {/* left card */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>{albumName}</div>
            <div style={{ fontWeight: 900 }}>{priceText}</div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.35 }}>{description}</div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`/shop?shareId=${encodeURIComponent(shareId)}`} style={btn}>
              Back to shop
            </a>
          </div>

          <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
            Snapshot source: <code>/api/publish/{shareId}/manifest</code>
          </div>
        </div>

        {/* right card: tracklist */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Preview tracklist (30s each)</div>

          {!tracks.length ? (
            <div style={{ opacity: 0.8 }}>No tracks found in manifest.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {tracks.map((t, i) => (
                <button
                  key={i}
                  style={trackBtn}
                  onClick={() => onPickTrack?.({ tracks, index: i, mode: "album" })}
                >
                  {i + 1}. {t.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const btn = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
};

const trackBtn = {
  textAlign: "left",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};
