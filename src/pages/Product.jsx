// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid rgba(255,0,0,0.55)", borderRadius: 12, background: "rgba(255,0,0,0.06)" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", opacity: 0.9 }}>{details}</pre>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={card}>
      {title ? <div style={{ fontWeight: 900, marginBottom: 10, opacity: 0.9 }}>{title}</div> : null}
      {children}
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

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  // ---- Album Meta (defensive: if publish later includes these fields, UI will pick them up) ----
  const albumTitle = String(manifest.albumTitle || "Album").trim();
  const artistName = String(manifest.artist || "Smart Bridge").trim();
  const coverUrl = String(manifest.coverUrl || manifest.coverArtUrl || "").trim();
  const trackCount = Number(manifest.trackCount || manifest.tracks?.length || 0);

  const tracks = manifest.tracks.map((t, i) => ({
    id: `trk-${i}`,
    title: String(t.title || "Untitled").trim(),
    s3Key: String(t.s3Key || "").trim(),
    // Duration is not in the manifest today; show preview label until we add real durations.
    durationLabel: "preview 0:30",
  }));

  const onClickTrackTitle = (i) => {
    onPickTrack?.({ tracks, index: i });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={pageTitleRow}>
        <div style={{ fontSize: 22, fontWeight: 950 }}>Product</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          ShareId: <code style={code}>{shareId}</code>
        </div>
      </div>

      <div style={grid}>
        {/* LEFT COLUMN (wider) */}
        <div>
          <Card>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={coverWrap}>
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Album cover"
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }}
                  />
                ) : (
                  <div style={coverFallback}>No cover</div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 950, lineHeight: 1.15 }}>{albumTitle}</div>
                <div style={{ marginTop: 6, opacity: 0.85 }}>{artistName}</div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.6 }}>
                  <div>
                    Tracks: <strong>{trackCount || "—"}</strong>
                  </div>
                  <div>
                    Published:{" "}
                    {manifest.publishedAt ? <code style={code}>{manifest.publishedAt}</code> : <span style={{ opacity: 0.65 }}>—</span>}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Album includes</div>
              <ul style={featureList}>
                <li>{trackCount || "—"} songs</li>
                <li>Authored bridges</li>
                <li>Two mode playback: Album</li>
                <li>Smart bridge</li>
                <li>FREE MP3</li>
                <li>NFT Mix Album</li>
                <li>Bonus swag and more</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card title="Purchase">
            <button
              onClick={() => onBuy?.(shareId)}
              style={buyBtn}
            >
              Buy — $18
            </button>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
              Checkout wiring can stay stubbed; this just routes to Sold today.
            </div>
          </Card>

          <Card title="Listen (Preview)">
            <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.5 }}>
              Tap a track title below to play a 30 second preview on the bottom player. Previews auto-advance.
            </div>
          </Card>

          <Card title="Tracks">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tracks.map((t, i) => (
                <div key={t.id} style={trackRow}>
                  <div style={{ width: 22, opacity: 0.65, fontWeight: 900 }}>{i + 1}</div>

                  <button
                    type="button"
                    onClick={() => onClickTrackTitle(i)}
                    style={trackTitleBtn}
                    title="Play preview"
                  >
                    {t.title} <span style={{ opacity: 0.65, fontWeight: 800 }}>({t.durationLabel})</span>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const grid = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "1.25fr 1fr", // left is ~25% wider than right
  gap: 14,
};

const pageTitleRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
};

const card = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 14,
};

const coverWrap = {
  width: 160,
  height: 160,
  borderRadius: 16,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  flex: "0 0 auto",
};

const coverFallback = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.7,
  fontWeight: 900,
};

const featureList = {
  margin: 0,
  paddingLeft: 18,
  display: "grid",
  gap: 6,
  opacity: 0.9,
};

const trackRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "6px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const trackTitleBtn = {
  flex: 1,
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
  padding: 0,
};

const buyBtn = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid rgba(16,185,129,0.45)",
  background: "rgba(16,185,129,0.85)",
  color: "#07130f",
  fontWeight: 950,
  fontSize: 16,
  cursor: "pointer",
};

const code = {
  padding: "2px 6px",
  borderRadius: 8,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.12)",
};
