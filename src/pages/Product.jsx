import { useEffect, useMemo, useState } from "react";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds || 0)));
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

  const [coverUrl, setCoverUrl] = useState("");

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

  // cover signer: prefer coverUrl, else sign coverS3Key
  useEffect(() => {
    let alive = true;

    async function run() {
      setCoverUrl("");

      if (!backendBase || !manifest?.ok) return;

      const direct = String(manifest.coverUrl || "").trim();
      if (direct) {
        if (alive) setCoverUrl(direct);
        return;
      }

      const s3Key = String(manifest.coverS3Key || "").trim();
      if (!s3Key) return;

      const r = await fetch(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(s3Key)}`, { cache: "no-store" });
      const j = await r.json().catch(() => null);
      if (!j?.ok || !j.url) return;

      if (alive) setCoverUrl(String(j.url));
    }

    run().catch(() => {});
    return () => {
      alive = false;
    };
  }, [backendBase, manifest]);

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const tracks = manifest.tracks.map((t, i) => ({
    id: `trk-${i}`,
    title: String(t.title || "").trim(),
    s3Key: String(t.s3Key || "").trim(),
    durationSeconds: Number(t.durationSeconds || 0),
  }));

  const albumTitle = String(manifest.albumTitle || "Album").trim();
  const performers = String(manifest.artist || "Smart Bridge").trim();
  const releaseDateIso = String(manifest.publishedAt || "").trim();
  const releaseDate = releaseDateIso ? new Date(releaseDateIso).toLocaleDateString() : "—";

  const totalSeconds = tracks.reduce((acc, t) => acc + (Number(t.durationSeconds || 0) || 0), 0);
  const totalTime = totalSeconds ? fmtTime(totalSeconds) : "—";

  return (
    <div style={{ padding: 18 }}>
      <div style={grid}>
        {/* LEFT: COVER ONLY */}
        <div style={coverCol}>
          {coverUrl ? (
            <img src={coverUrl} alt="Album cover" style={coverImg} />
          ) : (
            <div style={coverPh}>Cover image pending</div>
          )}
        </div>

        {/* RIGHT: CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Card 1: Album meta */}
          <div style={card}>
            <div style={metaLabel}>Album</div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 900 }}>{albumTitle}</div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, opacity: 0.92 }}>
              <div style={k}>Performers</div>
              <div style={v}>{performers}</div>

              <div style={k}>Release date</div>
              <div style={v}>{releaseDate}</div>

              <div style={k}>Total time</div>
              <div style={v}>{totalTime}</div>
            </div>
          </div>

          {/* Card 2: Buy + includes */}
          <div style={card}>
            <button onClick={() => onBuy?.(shareId)} style={buyBtn}>
              Buy — $18
            </button>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Album includes</div>
              <ul style={includesList}>
                <li>{tracks.length} songs</li>
                <li>Authored bridges</li>
                <li>Two mode playback: Album</li>
                <li>Smart bridge</li>
                <li>FREE MP3</li>
                <li>NFT Mix Album</li>
                <li>Bonus swag and more</li>
              </ul>
            </div>
          </div>

          {/* TRACKS CARD (always at bottom) */}
          <div style={{ ...card, marginTop: "auto" }}>
            <div style={{ fontWeight: 900 }}>Tracks</div>
            <div style={{ marginTop: 10 }}>
              {tracks.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0",
                    borderTop: i === 0 ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ width: 24, opacity: 0.65, fontWeight: 900 }}>{i + 1}</div>

                  <button
                    onClick={() => onPickTrack({ tracks, index: i })}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      color: "white",
                      fontWeight: 900,
                      cursor: "pointer",
                      padding: 0,
                    }}
                    title="Play preview"
                  >
                    {t.title || "Untitled"}{" "}
                    {t.durationSeconds ? <span style={{ opacity: 0.7 }}>({fmtTime(t.durationSeconds)})</span> : null}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              Click a song title to play a 30-second preview.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1.05fr",
  gap: 14,
};

const coverCol = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
};

const coverImg = {
  width: "100%",
  maxWidth: 560,
  aspectRatio: "1 / 1",
  objectFit: "cover",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
};

const coverPh = {
  width: "100%",
  maxWidth: 560,
  aspectRatio: "1 / 1",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0.7,
  fontWeight: 900,
};

const card = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 16,
};

const metaLabel = {
  fontSize: 12,
  fontWeight: 900,
  opacity: 0.65,
  textTransform: "uppercase",
};

const k = { fontSize: 12, opacity: 0.7, fontWeight: 900, textTransform: "uppercase" };
const v = { fontSize: 14, fontWeight: 900 };

const buyBtn = {
  width: "100%",
  padding: "10px 16px", // ~30% thinner than 14px
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.35)",
  background: "#22c55e", // brighter green
  color: "white",
  fontWeight: 900,
  fontSize: 16,
  cursor: "pointer",
};

const includesList = {
  margin: 0,
  paddingLeft: 18,
  lineHeight: 1.7,
  opacity: 0.95,
  fontSize: 13, // decreased font size
};
