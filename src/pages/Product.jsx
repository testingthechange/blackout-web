// src/pages/Product.jsx
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
  if (status === "fail") return <div style={{ padding: 24 }}>{String(err?.message || err)}</div>;
  if (!manifest) return <div style={{ padding: 24 }}>Loading…</div>;

  const albumTitle = manifest?.album?.title || "Album";
  const artist = manifest?.album?.artist || "";
  const releaseDate = manifest?.album?.releaseDate || "";
  const coverUrl = manifest?.album?.coverUrl || "";
  const priceText = "$18.50";

  const tracks = Array.isArray(manifest?.tracks) ? manifest.tracks : [];

  function fmtTime(sec) {
    const n = Number(sec || 0);
    if (!Number.isFinite(n) || n <= 0) return "—:—";
    const s = Math.floor(n);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 20,
          maxWidth: 1200,
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* COVER */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Album cover"
              style={{
                width: "100%",
                borderRadius: 18,
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
          ) : null}

          {/* CONTENT CARD */}
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
              (Player will be wired after layout + data are confirmed)
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* META CARD */}
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

          {/* BUY CARD */}
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

          {/* TRACKS (under BUY) */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 16,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Tracks</div>

            {!tracks.length ? (
              <div style={{ opacity: 0.75 }}>No tracks in manifest.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {tracks.map((t, i) => (
                  <div
                    key={t?.slot ?? i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>
                      {i + 1}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t?.title || `Track ${t?.slot ?? i + 1}`}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                        {fmtTime(t?.durationSec)}
                      </div>
                    </div>

                    {/* Placeholder play until preview logic is reintroduced */}
                    <button
                      disabled
                      title="Player wiring next (preview logic)"
                      style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.06)",
                        color: "rgba(255,255,255,0.55)",
                        fontWeight: 900,
                        cursor: "not-allowed",
                      }}
                    >
                      Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
