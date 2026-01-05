import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PreviewPlayer from "../components/PreviewPlayer.jsx";

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

export default function Shop({ backendBase, shareId }) {
  const [status, setStatus] = useState("no-shareid");
  const [manifest, setManifest] = useState(null);

  // page-only player state
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const signedCache = useMemo(() => new Map(), []);

  // load manifest
  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!shareId) {
      setStatus("no-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");
    setManifest(null);

    fetchJson(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`)
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("manifest missing tracks");
        setManifest(j);
        setStatus("ok");
      })
      .catch(() => {
        setManifest(null);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  const tracks = useMemo(() => {
    if (!manifest?.ok) return [];
    return manifest.tracks.map((t, i) => ({
      id: `trk-${i}`,
      title: String(t.title || "").trim(),
      s3Key: String(t.s3Key || "").trim(),
      url: "", // signed on demand
    }));
  }, [manifest]);

  // keep queue in sync with manifest tracks (but do not blow away signed urls if already present)
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

  const showPlayer = status === "ok" && queue.length > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginTop: 0 }}>Shop</h1>

      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        Publish: <strong>{status.toUpperCase()}</strong>
      </div>

      {!shareId ? (
        <div style={{ opacity: 0.8 }}>
          Add <code>?shareId=YOUR_SHARE_ID</code> to the URL, then this page will show the Product link and tracks.
        </div>
      ) : null}

      {status === "ok" ? (
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 10 }}>
            <Link to={`/shop/product/${encodeURIComponent(shareId)}`} style={{ color: "white", fontWeight: 900 }}>
              Go to Product Page →
            </Link>
          </div>

          <div style={{ fontWeight: 900, marginTop: 14 }}>Track previews (30s)</div>

          <div style={{ marginTop: 8 }}>
            {queue.map((t, i) => (
              <div
                key={t.id}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div style={{ width: 26, opacity: 0.7 }}>{i + 1}</div>
                <div style={{ flex: 1, fontWeight: 800 }}>{t.title || "Untitled"}</div>

                <button
                  onClick={() => playAt(i)} // user gesture => safe to start audio
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
        </div>
      ) : null}

      {showPlayer ? (
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
