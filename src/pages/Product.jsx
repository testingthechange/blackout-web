import { useEffect, useMemo, useState } from "react";
import PreviewPlayer from "../components/PreviewPlayer.jsx";

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

export default function Product({ backendBase, onBuy }) {
  const shareId = useMemo(() => {
    const m = window.location.pathname.match(/\/shop\/product\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }, []);

  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  // page-only player state
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const signedCache = useMemo(() => new Map(), []);

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
    setManifest(null);

    fetchJson(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`)
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

  const tracks = useMemo(() => {
    if (!manifest?.ok) return [];
    return manifest.tracks.map((t, i) => ({
      id: `trk-${i}`,
      title: String(t.title || "").trim(),
      s3Key: String(t.s3Key || "").trim(),
      url: "",
    }));
  }, [manifest]);

  // sync queue with tracks
  useEffect(() => {
    if (!tracks.length) {
      setQueue([]);
      setIdx(0);
      setIsPlaying(false);
      return;
    }
    setQueue((prev) => {
      if (!prev?.length) return tracks;
      const byKey = new Map(prev.map((x) => [String(x.s3Key || ""), x]));
      return tracks.map((t) => {
        const old = byKey.get(t.s3Key);
        return old?.url ? { ...t, url: old.url } : t;
      });
    });
  }, [tracks]);

  async function signTrackIfNeeded(track) {
    if (!track) return track;
    if (track.url) return track;

    const s3Key = String(track.s3Key || "").trim();
    if (!s3Key) return track;

    if (!backendBase) throw new Error("missing backendBase");

    if (signedCache.has(s3Key)) {
      return { ...track, url: signedCache.get(s3Key) };
    }

    const j = await fetchJson(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(s3Key)}`);
    if (!j?.ok || !j.url) throw new Error("failed to sign url");

    signedCache.set(s3Key, j.url);
    return { ...track, url: j.url };
  }

  async function playAt(i) {
    if (!queue.length) return;
    const nextI = Math.max(0, Math.min(i, queue.length - 1));
    const t = await signTrackIfNeeded(queue[nextI]);

    setQueue((prev) => prev.map((x, k) => (k === nextI ? t : x)));
    setIdx(nextI);
    setIsPlaying(true);
  }

  async function goPrev() {
    if (!queue.length) return;
    const nextI = idx > 0 ? idx - 1 : queue.length - 1;
    const t = await signTrackIfNeeded(queue[nextI]);
    setQueue((prev) => prev.map((x, k) => (k === nextI ? t : x)));
    setIdx(nextI);
    setIsPlaying(true);
  }

  async function goNext() {
    if (!queue.length) return;
    const nextI = (idx + 1) % queue.length;
    const t = await signTrackIfNeeded(queue[nextI]);
    setQueue((prev) => prev.map((x, k) => (k === nextI ? t : x)));
    setIdx(nextI);
    setIsPlaying(true);
  }

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>Product</div>
      <div style={{ opacity: 0.8, marginTop: 4 }}>
        ShareId: <code>{shareId}</code>
      </div>

      <div style={{ marginTop: 16, fontWeight: 900 }}>Tracks (30s preview, continuous)</div>

      <div style={{ marginTop: 8 }}>
        {queue.map((t, i) => (
          <div
            key={t.id}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div style={{ width: 26, opacity: 0.7 }}>{i + 1}</div>
            <div style={{ flex: 1, fontWeight: 800 }}>{t.title || "Untitled"}</div>

            <button
              onClick={() => playAt(i)} // user gesture
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ▶ Play
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => onBuy?.(shareId)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.14)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Buy
        </button>
      </div>

      {queue.length ? (
        <PreviewPlayer
          tracks={queue}
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
