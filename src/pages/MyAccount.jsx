// src/pages/MyAccount.jsx
import { useEffect, useMemo, useState } from "react";
import BottomPlayer from "../components/BottomPlayer.jsx";

function safeStr(v) {
  return String(v ?? "").trim();
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

export default function MyAccount({ backendBase, shareId }) {
  const sid = safeStr(shareId);

  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);

  // Account = full player state
  const [queue, setQueue] = useState([]);
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  // load manifest
  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!sid) {
      setStatus("no-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");
    fetch(`${backendBase}/api/publish/${encodeURIComponent(sid)}/manifest`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("bad manifest");
        setManifest(j);
        setStatus("ok");
      })
      .catch(() => {
        setManifest(null);
        setStatus("fail");
      });
  }, [backendBase, sid]);

  // queue (no cached URLs)
  useEffect(() => {
    if (!manifest?.ok) {
      setQueue([]);
      setIdx(0);
      setIsPlaying(false);
      return;
    }

    const tracks = (manifest.tracks || []).map((t, i) => ({
      id: `acct-${sid}-${i}`,
      title: safeStr(t?.title) || `Track ${i + 1}`,
      s3Key: safeStr(t?.s3Key),
      url: "",
    }));

    setQueue(tracks);
    setIdx(0);
    setIsPlaying(false);
  }, [manifest, sid]);

  // refresh active URL
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!backendBase) return;
      const t = queue[idx];
      if (!t) return;
      if (!t.s3Key) return;
      if (t.url) return;

      try {
        const playback = await fetchJson(
          `${backendBase}/api/playback-url?s3Key=${encodeURIComponent(t.s3Key)}`
        );
        const url = safeStr(playback?.url);
        if (!url) throw new Error("missing playback url");

        if (!alive) return;
        setQueue((prev) => (prev || []).map((x, i) => (i === idx ? { ...x, url } : x)));
      } catch {
        if (!alive) return;
        setIsPlaying(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [backendBase, queue, idx]);

  const activeTrack = queue[idx] || null;

  const order = useMemo(() => queue.map((_, i) => i), [queue]);
  const nextIndex = () => {
    if (!queue.length) return 0;
    if (!shuffle) return (idx + 1) % queue.length;
    // simple shuffle: random different index
    if (queue.length === 1) return 0;
    let j = idx;
    for (let tries = 0; tries < 8 && j === idx; tries++) {
      j = Math.floor(Math.random() * queue.length);
    }
    return j;
  };

  return (
    <div style={{ paddingBottom: 140 }}>
      <h1 style={{ margin: 0 }}>Account</h1>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
        Publish: {status.toUpperCase()}
        {sid ? (
          <>
            {" "}
            · ShareId: <span style={{ fontFamily: "monospace", fontWeight: 900 }}>{sid}</span>
          </>
        ) : null}
      </div>

      {!sid ? (
        <div style={{ marginTop: 14, opacity: 0.85 }}>
          Add <code>?shareId=YOUR_SHARE_ID</code> to the URL.
        </div>
      ) : null}

      {status === "ok" ? (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid rgba(255,255,255,0.16)", borderRadius: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Your Album</div>

          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {queue.map((t, i) => (
              <li key={t.id} style={{ marginBottom: 6 }}>
                <button
                  onClick={() => {
                    setIdx(i);
                    setIsPlaying(true);
                  }}
                  style={{
                    cursor: "pointer",
                    background: "transparent",
                    color: "white",
                    border: "none",
                    padding: 0,
                    fontWeight: i === idx ? 900 : 700,
                    textDecoration: i === idx ? "underline" : "none",
                  }}
                >
                  {t.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* Account owns playback (full) */}
      {activeTrack ? (
        <BottomPlayer
          mode="full"
          track={activeTrack}
          queue={queue}
          index={idx}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
          shuffle={shuffle}
          repeat={repeat}
          onToggleShuffle={() => setShuffle((v) => !v)}
          onToggleRepeat={() => setRepeat((v) => !v)}
          onPrev={() => setIdx((i) => (i > 0 ? i - 1 : queue.length - 1))}
          onNext={() => setIdx(() => (repeat ? idx : nextIndex()))}
        />
      ) : null}
    </div>
  );
}
