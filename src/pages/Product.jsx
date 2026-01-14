// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";
import BottomPlayer from "../components/BottomPlayer.jsx";

export default function Product({ backendBase: backendBaseProp, shareId: shareIdProp }) {
  const backendBase = (backendBaseProp || import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");
  const shareId = useMemo(() => String(shareIdProp || "").trim(), [shareIdProp]);

  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  // --- local (product-only) player state ---
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
        if (!j?.ok) throw new Error("manifest not ok");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  const tracks = useMemo(() => {
    const src = Array.isArray(manifest?.tracks) ? manifest.tracks : Array.isArray(manifest?.album?.tracks) ? manifest.album.tracks : [];
    return src
      .map((t) => {
        const title = String(t?.title || "").trim() || `Track ${t?.slot ?? ""}`.trim();
        const audioUrl = String(t?.audioUrl || t?.url || "").trim();
        const durationSec = Number(t?.durationSec || 0);
        return {
          title,
          // BottomPlayer will read url OR audioUrl (we provide both for safety)
          url: audioUrl,
          audioUrl,
          durationSec,
        };
      })
      .filter((t) => t.url || t.audioUrl);
  }, [manifest]);

  // keep player queue in sync when manifest loads/changes
  useEffect(() => {
    setQueue(tracks);
    setIdx(0);
    setIsPlaying(false);
  }, [tracks]);

  function fmtTime(sec) {
    const n = Number(sec || 0);
    if (!Number.isFinite(n) || n <= 0) return "—:—";
    const s = Math.floor(n);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function playAt(i) {
    if (!queue.length) return;
    const next = Math.max(0, Math.min(Number(i || 0), queue.length - 1));
    setIdx(next);
    setIsPlaying(true);
  }

  function goPrev() {
    if (!queue.length) return;
    setIdx((v) => (v - 1 + queue.length) % queue.length);
    setIsPlaying(true);
  }

  function goNext() {
    if (!queue.length) return;
    setIdx((v) => (v + 1) % queue.length);
    setIsPlaying(true);
  }

  if (status === "missing-env") return <div style={{ padding: 24 }}>Missing backend env</div>;
  if (status === "missing-shareid") return <div style={{ padding: 24 }}>Missing shareId</div>;
  if (status === "fail") return <div style={{ padding: 24 }}>{String(err?.message || err)}</div>;
  if (!manifest) return <div style={{ padding: 24 }}>Loading…</div>;

  const albumTitle = manifest?.album?.title || manifest?.albumName || "Album";
  const artist = manifest?.album?.artist || manifest?.performers || "";
  const releaseDate = manifest?.album?.releaseDate || "";
  const coverUrl = manifest?.album?.coverUrl || manifest?.coverUrl || "";
  const priceText = "$18.50";

  const activeTrack = queue[idx] || null;

  return (
    <div style={{ padding: 24, paddingBottom: 140 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, maxWidth: 1200 }}>
        {/* LEFT (bigger): cover + extra card */}
        <div style={{ display: "grid", gap: 16 }}>
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

          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Album</div>
            <div style={{ opacity: 0.8 }}>
              {albumTitle}
              {artist ? ` — ${artist}` : ""}
            </div>
            {releaseDate ? <div style={{ opacity: 0.6, fontSize: 12, marginTop: 6 }}>Released {releaseDate}</div> : null}
          </div>
        </div>

        {/* RIGHT (smaller): meta + buy pill only + tracks under buy */}
        <div style={{ display: "grid", gap: 16 }}>
          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{albumTitle}</div>
            {artist ? <div style={{ opacity: 0.85, marginTop: 4 }}>{artist}</div> : null}
            {releaseDate ? <div style={{ opacity: 0.6, fontSize: 12, marginTop: 6 }}>Released {releaseDate}</div> : null}
          </div>

          {/* BUY: remove aura/green card bg; pill only */}
          <div style={{ padding: 0 }}>
            <button
              style={{
                width: "100%",
                padding: "16px 18px",
                borderRadius: 16,
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

          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Tracks</div>

            {!tracks.length ? (
              <div style={{ opacity: 0.75 }}>No tracks in manifest.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {tracks.map((t, i) => (
                  <button key={i} onClick={() => playAt(i)} style={trackRowBtn}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 10, alignItems: "center" }}>
                      <div style={{ opacity: 0.7, fontWeight: 900, fontSize: 12 }}>{i + 1}</div>
                      <div style={{ minWidth: 0, textAlign: "left" }}>
                        <div style={trackTitle}>{t.title}</div>
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 900 }}>{fmtTime(t.durationSec)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT PREVIEW PLAYER: 30s then auto-next */}
      {activeTrack ? (
        <BottomPlayer
          mode="product-preview"
          track={activeTrack}
          queue={queue}
          index={idx}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
          onPrev={goPrev}
          onNext={goNext}
          previewSeconds={30}
        />
      ) : null}
    </div>
  );
}

const card = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.03)",
};

const trackRowBtn = {
  textAlign: "left",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const trackTitle = {
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
