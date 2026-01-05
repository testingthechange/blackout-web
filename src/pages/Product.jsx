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

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

export default function Product({ backendBase, onPickTrack, onBuy }) {
  const shareId = useMemo(() => {
    const m = window.location.pathname.match(/\/shop\/product\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }, []);

  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  // durations by s3Key
  const [durByKey, setDurByKey] = useState({}); // { [s3Key]: seconds }
  const [totalSec, setTotalSec] = useState(0);

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
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
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

  // Compute durations (best-effort) after manifest loads.
  // Uses on-demand signing to avoid expired URLs being stored in the manifest.
  useEffect(() => {
    let alive = true;
    if (!backendBase) return;
    if (!manifest?.ok || !Array.isArray(manifest.tracks)) return;

    (async () => {
      for (const t of manifest.tracks) {
        if (!alive) return;

        const s3Key = String(t?.s3Key || "").trim();
        if (!s3Key) continue;
        if (durByKey[s3Key] != null) continue;

        try {
          const r = await fetch(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(s3Key)}`, { cache: "no-store" });
          const j = await r.json().catch(() => null);
          if (!r.ok || !j?.ok || !j?.url) continue;

          const url = String(j.url || "").trim();
          if (!url) continue;

          const seconds = await new Promise((resolve, reject) => {
            const a = new Audio();
            a.preload = "metadata";
            a.src = url;

            const cleanup = () => {
              a.onloadedmetadata = null;
              a.onerror = null;
            };

            a.onloadedmetadata = () => {
              cleanup();
              const d = Number(a.duration || 0);
              resolve(d > 0 ? d : 0);
            };
            a.onerror = () => {
              cleanup();
              reject(new Error("audio metadata error"));
            };
          });

          if (!alive) return;
          setDurByKey((prev) => ({ ...prev, [s3Key]: seconds }));
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendBase, manifest?.shareId]);

  // total time
  useEffect(() => {
    if (!manifest?.ok || !Array.isArray(manifest.tracks)) return;
    let sum = 0;
    for (const t of manifest.tracks) {
      const k = String(t?.s3Key || "").trim();
      const d = durByKey[k];
      if (d && Number.isFinite(d)) sum += Number(d);
    }
    setTotalSec(sum);
  }, [manifest, durByKey]);

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const tracks = manifest.tracks.map((t, i) => {
    const s3Key = String(t.s3Key || "").trim();
    const sec = durByKey[s3Key];
    const suffix = sec ? ` (${fmtTime(sec)})` : "";
    return {
      id: `trk-${i}`,
      title: `${String(t.title || "").trim() || "Untitled"}${suffix}`,
      s3Key,
    };
  });

  // --- LAYOUT LOCK ---
  // Left column: cover only.
  // Right column: Card1 meta, Card2 buy+includes, Card3 tracks (always bottom).
  return (
    <div style={{ padding: 16 }}>
      <div style={grid}>
        {/* LEFT COLUMN: COVER ONLY */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Cover</div>
            <div style={{ marginTop: 10 }}>
              <div style={{ padding: 14, borderRadius: 14, border: "1px dashed rgba(255,255,255,0.18)", opacity: 0.8 }}>
                Cover image pending
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Card 1: Album meta (TOP of right column) */}
          <div style={card}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Album</div>
            <div style={{ marginTop: 10, display: "grid", gap: 10, fontSize: 13, opacity: 0.92 }}>
              <div>
                <span style={label}>Album name</span>
                <div style={value}>—</div>
              </div>
              <div>
                <span style={label}>Performers</span>
                <div style={value}>—</div>
              </div>
              <div>
                <span style={label}>Release date</span>
                <div style={value}>—</div>
              </div>
              <div>
                <span style={label}>Total time</span>
                <div style={value}>{totalSec > 0 ? fmtTime(totalSec) : "—"}</div>
              </div>
            </div>
          </div>

          {/* Card 2: Buy + includes */}
          <div style={card}>
            <button onClick={() => onBuy?.(shareId)} style={buyBtn}>
              Buy — $18
            </button>

            <div style={{ marginTop: 14, fontWeight: 900 }}>Album includes</div>
            <ul style={includesList}>
              <li style={includesItem}>3 songs</li>
              <li style={includesItem}>Authored bridges</li>
              <li style={includesItem}>Two mode playback: Album</li>
              <li style={includesItem}>Smart bridge</li>
              <li style={includesItem}>FREE MP3</li>
              <li style={includesItem}>NFT Mix Album</li>
              <li style={includesItem}>Bonus swag and more</li>
            </ul>
          </div>

          {/* Card 3: Tracks (always bottom) */}
          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Tracks</div>

            <div style={{ fontSize: 12, opacity: 0.78, marginBottom: 10 }}>
              Click a song title to play a 30-second preview.
            </div>

            <div>
              {tracks.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() =>
                    onPickTrack({
                      tracks: tracks.map((x) => ({ title: x.title, s3Key: x.s3Key })),
                      index: i,
                    })
                  }
                  style={trackRowBtn}
                >
                  <span style={{ width: 28, opacity: 0.7 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: 900, textAlign: "left" }}>{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  // left column only cover, still wider than right by ~10%
  gridTemplateColumns: "1.35fr 1fr",
  gap: 14,
  alignItems: "start",
};

const card = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 14,
};

const label = {
  fontSize: 12,
  fontWeight: 900,
  opacity: 0.7,
  textTransform: "uppercase",
};

const value = {
  marginTop: 4,
  fontWeight: 900,
};

const buyBtn = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(34,197,94,0.70)",
  background: "rgba(34,197,94,0.42)",
  color: "white",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
};

const includesList = {
  margin: "10px 0 0",
  paddingLeft: 18,
  display: "grid",
  gap: 6,
};

const includesItem = {
  fontSize: 13,
  opacity: 0.92,
  fontWeight: 800,
};

const trackRowBtn = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  cursor: "pointer",
  marginBottom: 10,
};
