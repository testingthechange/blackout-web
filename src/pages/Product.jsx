import { useEffect, useMemo, useState } from "react";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
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

    let alive = true;
    setStatus("loading");
    setErr(null);
    setManifest(null);
    setCoverUrl("");

    (async () => {
      try {
        const m = await fetchJson(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`);
        if (!alive) return;

        if (!m?.ok || !Array.isArray(m.tracks)) throw new Error("manifest missing tracks");
        setManifest(m);

        // Optional cover support (same as Shop):
        const cUrl = String(m?.coverUrl || "").trim();
        const cKey = String(m?.coverS3Key || "").trim();

        if (cUrl) {
          setCoverUrl(cUrl);
        } else if (cKey) {
          const s = await fetchJson(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(cKey)}`);
          if (!alive) return;
          if (s?.ok && s?.url) setCoverUrl(String(s.url));
        }

        setStatus("ok");
      } catch (e) {
        if (!alive) return;
        setManifest(null);
        setErr(e);
        setStatus("fail");
      }
    })();

    return () => {
      alive = false;
    };
  }, [backendBase, shareId]);

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const tracks = manifest.tracks.map((t, i) => ({
    id: `trk-${i}`,
    title: String(t.title || "").trim() || "Untitled",
    // duration is not available from manifest yet; placeholder
    durationLabel: "",
    s3Key: String(t.s3Key || "").trim(),
  }));

  // Right column meta card values (placeholders until publish writes them)
  const albumName = String(manifest?.albumName || "").trim();
  const performers = String(manifest?.performers || "").trim();
  const releaseDate = String(manifest?.releaseDate || "").trim();
  const totalTime = String(manifest?.totalTime || "").trim();

  return (
    <div style={{ padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          {/* LEFT COLUMN (locked): cover only */}
          <div style={{ ...card, padding: 14 }}>
            <div style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 18, overflow: "hidden", border: border }}>
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Album cover"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)" }} />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (locked): meta, buy+includes, tracks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Card 1: Album meta */}
            <div style={{ ...card }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>Album</div>

              <Row label="Album name" value={albumName || "—"} />
              <Row label="Performers" value={performers || "—"} />
              <Row label="Release date" value={releaseDate || "—"} />
              <Row label="Total time" value={totalTime || "—"} />
            </div>

            {/* Card 2: Buy + includes (content belongs right column) */}
            <div style={{ ...card }}>
              <button
                onClick={() => onBuy?.(shareId)}
                style={buyBtn}
              >
                Buy — $18
              </button>

              <div style={{ marginTop: 12, fontWeight: 900 }}>Album includes</div>
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, opacity: 0.92, fontSize: 13, lineHeight: 1.7 }}>
                <li>3 songs</li>
                <li>Authored bridges</li>
                <li>Two mode playback: Album</li>
                <li>Smart bridge</li>
                <li>FREE MP3</li>
                <li>NFT Mix Album</li>
                <li>Bonus swag and more</li>
              </ul>
            </div>

            {/* Card 3: Tracks (locked bottom) */}
            <div style={{ ...card }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Tracks</div>

              <div style={{ opacity: 0.75, fontSize: 12, marginBottom: 10 }}>
                Click a song title to play a 30-second preview.
              </div>

              <div>
                {tracks.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => onPickTrack?.({ tracks, index: i })}
                    style={trackRowBtn}
                  >
                    <span style={{ width: 22, opacity: 0.7 }}>{i + 1}</span>
                    <span style={{ flex: 1, textAlign: "left", fontWeight: 800 }}>
                      {t.title} {t.durationLabel ? `(${t.durationLabel})` : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NOTE: Player is controlled by App.jsx; Product just emits onPickTrack */}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: "6px 0" }}>
      <div style={{ width: 120, opacity: 0.7, fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>{label}</div>
      <div style={{ flex: 1, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

const border = "1px solid rgba(255,255,255,0.14)";

const card = {
  background: "rgba(255,255,255,0.04)",
  border,
  borderRadius: 18,
  padding: 14,
};

const buyBtn = {
  width: "70%", // ~30% thinner than full width
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.35)",
  background: "#22c55e", // brighter green
  color: "#0b0c10",
  fontWeight: 1000,
  cursor: "pointer",
};

const trackRowBtn = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 10px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  cursor: "pointer",
  marginBottom: 8,
};
