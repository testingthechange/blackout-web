import { useEffect, useMemo, useState } from "react";

export default function Product({
  backendBase: backendBaseProp,
  shareId: shareIdProp,
  onPickTrack,
}) {
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
    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((j) => {
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  if (status === "missing-env") return <div style={pad}>Missing backend env</div>;
  if (status === "missing-shareid") return <div style={pad}>Missing shareId</div>;
  if (status === "fail") return <div style={pad}>Failed: {String(err)}</div>;
  if (!manifest) return <div style={pad}>Loading…</div>;

  const album = manifest.album || {};
  const tracks = Array.isArray(manifest.tracks) ? manifest.tracks : [];

  return (
    <div style={{ padding: 18 }}>
      <div style={title}>Product</div>

      <div style={grid}>
        {/* COLUMN 1 — CONTENT (WIDE) */}
        <div style={{ display: "grid", gap: 14 }}>
          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{album.title || "Album"}</div>
            <div style={{ opacity: 0.8, marginTop: 4 }}>{album.artist || ""}</div>
            <div style={{ opacity: 0.75, marginTop: 8 }}>
              Digital album access tied to published snapshot.
            </div>
          </div>

          <button style={buyBtn}>BUY $18.50</button>

          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Instant access · No friction</div>
            <div style={{ opacity: 0.85, lineHeight: 1.45 }}>
              Preview tracks below. Purchase unlocks full-length playback in your account across all
              devices.
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <div style={pill}>High-quality audio</div>
              <div style={pill}>Fast checkout</div>
              <div style={pill}>Permanent access</div>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Tracklist</div>

            {!tracks.length ? (
              <div style={{ opacity: 0.75 }}>No tracks available</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {tracks.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    style={trackRowBtn}
                    onClick={() => onPickTrack?.({ tracks, index: i, mode: "album" })}
                  >
                    <div style={{ opacity: 0.75 }}>{fmt(t.durationSec)}</div>
                    <div style={{ fontWeight: 900 }}>
                      {i + 1}. {t.title || `Track ${i + 1}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2 — COVER (NARROW) */}
        <div>
          <div style={coverWrap}>
            {album.coverUrl ? (
              <img src={album.coverUrl} alt="Album cover" style={coverImg} />
            ) : (
              <div style={coverFallback}>No cover</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers & styles ---------- */

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const pad = { padding: 18 };

const title = {
  fontWeight: 900,
  fontSize: 22,
  marginBottom: 14,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 420px", // flipped sizes
  gap: 18,
  maxWidth: 1200,
};

const coverWrap = {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
};

const coverImg = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const coverFallback = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.6,
  fontWeight: 900,
};

const card = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.03)",
};

const buyBtn = {
  width: "100%",
  padding: "18px 20px",
  borderRadius: 16,
  border: "none",
  background: "#5fbf6f",
  color: "#0b1f14",
  fontWeight: 900,
  fontSize: 20,
  cursor: "pointer",
};

const pill = {
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
};

const trackRow = {
  display: "grid",
  gridTemplateColumns: "48px 1fr",
  gap: 10,
  alignItems: "center",
};

const trackRowBtn = {
  ...trackRow,
  width: "100%",
  textAlign: "left",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  borderRadius: 12,
  padding: "10px 12px",
  cursor: "pointer",
  color: "white",
};
