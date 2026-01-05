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

  // cover signer
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
  const artist = String(manifest.artist || "Smart Bridge").trim();

  return (
    <div style={{ padding: 18 }}>
      <div style={grid}>
        {/* LEFT (wider) */}
        <div style={card}>
          <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.65, textTransform: "uppercase" }}>Product</div>

          <div style={{ marginTop: 10, fontSize: 26, fontWeight: 900 }}>{albumTitle}</div>
          <div style={{ marginTop: 4, opacity: 0.8 }}>{artist}</div>

          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Album cover"
              style={{
                marginTop: 14,
                width: "100%",
                maxWidth: 520,
                aspectRatio: "1 / 1",
                objectFit: "cover",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            />
          ) : (
            <div
              style={{
                marginTop: 14,
                width: "100%",
                maxWidth: 520,
                aspectRatio: "1 / 1",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
                fontWeight: 900,
              }}
            >
              Cover image pending
            </div>
          )}

          <button
            onClick={() => onBuy?.(shareId)}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.35)",
              background: "#16a34a",
              color: "white",
              fontWeight: 900,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Buy — $18
          </button>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, marginBottom: 8 }}>Album includes</div>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, opacity: 0.9 }}>
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

        {/* RIGHT (narrower) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontWeight: 900 }}>Album</div>
            <div style={{ marginTop: 6, opacity: 0.8, lineHeight: 1.6 }}>
              {tracks.length} songs, authored bridges, and two mode playback.
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 900 }}>FREE MP3 + NFT Mix Album</div>
            <div style={{ marginTop: 6, opacity: 0.8, lineHeight: 1.6 }}>
              Your purchase includes downloadable MP3 and access to the NFT Mix Album.
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 900 }}>Bonus swag</div>
            <div style={{ marginTop: 6, opacity: 0.8, lineHeight: 1.6 }}>
              Bonus items and perks may be included depending on the release.
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
  gridTemplateColumns: "1.25fr 1fr", // left ~25% wider
  gap: 14,
};

const card = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 16,
};
