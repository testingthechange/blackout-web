// src/pages/MyAccount.jsx
import { useEffect, useMemo, useRef, useState } from "react";

function safeString(v) {
  return String(v ?? "").trim();
}

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid rgba(255,0,0,0.6)", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", opacity: 0.9 }}>{details}</pre>
    </div>
  );
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

export default function MyAccount({ backendBase, shareId }) {
  const sid = safeString(shareId);

  // ---------- LOAD MANIFEST ----------
  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      return;
    }
    if (!sid) {
      setStatus("missing-shareid");
      return;
    }

    setStatus("loading");
    setErr(null);
    setManifest(null);

    fetchJson(`${backendBase}/api/publish/${encodeURIComponent(sid)}/manifest`)
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("manifest missing tracks");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, sid]);

  // ---------- TRACKS MODEL ----------
  const tracks = useMemo(() => {
    const ts = manifest?.tracks || [];
    return ts.map((t, i) => ({
      id: `trk-${i}`,
      slot: Number(t.slot || i + 1),
      title: safeString(t.title) || "Untitled",
      s3Key: safeString(t.s3Key),
      // filled in on-demand:
      url: "",
      durationSec: Number(t.durationSec || 0), // if backend/publish later provides it
    }));
  }, [manifest]);

  // Album meta (optional fields if manifest adds them later)
  const albumTitle = safeString(manifest?.albumTitle) || "Album";
  const performers = safeString(manifest?.performers) || "—";
  const releaseDate = safeString(manifest?.releaseDate) || "—";
  const totalTimeLabel = useMemo(() => {
    const total = tracks.reduce((a, t) => a + (t.durationSec || 0), 0);
    return total > 0 ? fmtTime(total) : "—";
  }, [tracks]);

  // Cover (supports either absolute coverUrl, or coverS3Key via signing)
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      setCoverUrl("");
      if (!backendBase || !manifest?.ok) return;

      const direct = safeString(manifest?.coverUrl);
      if (direct) {
        if (!alive) return;
        setCoverUrl(direct);
        return;
      }

      const coverS3Key = safeString(manifest?.coverS3Key);
      if (!coverS3Key) return;

      try {
        const j = await fetchJson(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(coverS3Key)}`);
        if (!alive) return;
        if (j?.ok && j.url) setCoverUrl(j.url);
      } catch {
        // ignore; show placeholder
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [backendBase, manifest]);

  // ---------- PAGE-ONLY PLAYER (FULL MODE) ----------
  const audioRef = useRef(null);

  const [queue, setQueue] = useState([]); // array of track objects (title, s3Key, url?)
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);

  const active = queue[idx] || null;

  // signed url cache per s3Key
  const signedCache = useMemo(() => new Map(), []);

  async function signTrackIfNeeded(track) {
    if (!track) return null;
    const s3Key = safeString(track.s3Key);
    if (!s3Key) return track;
    if (track.url) return track;

    if (signedCache.has(s3Key)) {
      return { ...track, url: signedCache.get(s3Key) };
    }

    const j = await fetchJson(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(s3Key)}`);
    if (!j?.ok || !j.url) throw new Error("Failed to sign playback url");
    signedCache.set(s3Key, j.url);
    return { ...track, url: j.url };
  }

  async function playAt(i) {
    if (!backendBase) return;
    if (!tracks.length) return;

    const clamped = Math.max(0, Math.min(Number(i || 0), tracks.length - 1));
    const t = await signTrackIfNeeded(tracks[clamped]);
    const nextQueue = tracks.map((x, k) => (k === clamped ? t : x));
    setQueue(nextQueue);
    setIdx(clamped);
    setIsPlaying(true);
  }

  async function goPrev() {
    if (!queue.length) return;
    let nextI = idx > 0 ? idx - 1 : queue.length - 1;

    if (shuffle && queue.length > 1) {
      nextI = Math.floor(Math.random() * queue.length);
      if (nextI === idx) nextI = (nextI + 1) % queue.length;
    }

    const t = await signTrackIfNeeded(queue[nextI]);
    const nextQueue = queue.map((x, k) => (k === nextI ? t : x));
    setQueue(nextQueue);
    setIdx(nextI);
    setIsPlaying(true);
  }

  async function goNext() {
    if (!queue.length) return;
    let nextI = (idx + 1) % queue.length;

    if (shuffle && queue.length > 1) {
      nextI = Math.floor(Math.random() * queue.length);
      if (nextI === idx) nextI = (nextI + 1) % queue.length;
    }

    const t = await signTrackIfNeeded(queue[nextI]);
    const nextQueue = queue.map((x, k) => (k === nextI ? t : x));
    setQueue(nextQueue);
    setIdx(nextI);
    setIsPlaying(true);
  }

  // Ensure player queue is set once manifest loads (so the player is always "ready")
  useEffect(() => {
    if (!tracks.length) return;
    setQueue(tracks);
    setIdx(0);
    setIsPlaying(false);
    // do not auto-play
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest?.shareId]);

  // Apply src to audio when active track changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const src = safeString(active?.url);
    el.pause();

    if (!src) {
      el.removeAttribute("src");
      el.load();
      return;
    }

    el.src = src;
    el.load();

    if (isPlaying) {
      el.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.url]);

  // External play/pause
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const src = safeString(active?.url);
    if (!src) return;

    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, active?.url]);

  // Scrub + times
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [userSeeking, setUserSeeking] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDur(Number(el.duration || 0));
    const onTime = () => {
      if (userSeeking) return;
      setCur(Number(el.currentTime || 0));
    };
    const onEnded = () => {
      if (repeat) {
        el.currentTime = 0;
        el.play().catch(() => {});
        return;
      }
      goNext();
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [repeat, goNext, userSeeking]);

  // ---------- RENDER STATES ----------
  if (status === "missing-env") {
    return <ErrorPanel title="Backend missing" details="Missing backendBase prop (VITE_ALBUM_BACKEND_URL)." />;
  }
  if (status === "missing-shareid") {
    return <ErrorPanel title="Missing shareId" details="Open Account with ?shareId=YOUR_SHARE_ID" />;
  }
  if (status === "fail") {
    return <ErrorPanel title="Failed to load account album" details={String(err?.message || err)} />;
  }

  // ---------- LAYOUT ----------
  return (
    <div style={{ paddingBottom: 120 }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>My Account</div>
      <div style={{ opacity: 0.75, fontSize: 12 }}>
        ShareId: <code>{sid}</code>
      </div>

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16 }}>
        {/* LEFT: cover only */}
        <div style={card()}>
          <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75, textTransform: "uppercase" }}>Cover</div>
          <div style={{ marginTop: 10 }}>
            {coverUrl ? (
              <img
                src={coverUrl}
                alt="cover"
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}
              />
            ) : (
              <div style={{ padding: 14, borderRadius: 12, border: "1px dashed rgba(255,255,255,0.20)", opacity: 0.8 }}>
                Cover image pending
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: meta + tracks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={card()}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75, textTransform: "uppercase" }}>Album</div>

            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <MetaRow label="Album name" value={albumTitle} />
              <MetaRow label="Performers" value={performers} />
              <MetaRow label="Release date" value={releaseDate} />
              <MetaRow label="Total time" value={totalTimeLabel} />
            </div>
          </div>

          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75, textTransform: "uppercase" }}>Tracks</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {tracks.length ? `${tracks.length} track${tracks.length === 1 ? "" : "s"}` : "—"}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              {!tracks.length ? (
                <div style={{ opacity: 0.8 }}>No tracks.</div>
              ) : (
                tracks.map((t, i) => {
                  const isActive = queue[idx]?.s3Key && t.s3Key && queue[idx].s3Key === t.s3Key;
                  const durLabel = t.durationSec ? ` (${fmtTime(t.durationSec)})` : "";
                  return (
                    <button
                      key={t.id}
                      onClick={() => playAt(i)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 10px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: isActive ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                      title="Click to play"
                    >
                      <div style={{ width: 28, opacity: 0.7, fontWeight: 900 }}>{i + 1}</div>
                      <div style={{ flex: 1, fontWeight: 900 }}>
                        {t.title}
                        <span style={{ opacity: 0.75, fontWeight: 800 }}>{durLabel}</span>
                      </div>
                      <div style={{ fontWeight: 900, opacity: 0.9 }}>{isActive && isPlaying ? "❚❚" : "▶"}</div>
                    </button>
                  );
                })
              )}

              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                Click a song title to play.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAGE-ONLY PLAYER: always visible at bottom */}
      <AccountBottomPlayer
        audioRef={audioRef}
        track={active}
        isPlaying={isPlaying}
        onPlayPause={setIsPlaying}
        onPrev={goPrev}
        onNext={goNext}
        shuffle={shuffle}
        repeat={repeat}
        onToggleShuffle={() => setShuffle((v) => !v)}
        onToggleRepeat={() => setRepeat((v) => !v)}
        dur={dur}
        cur={cur}
        onScrub={(v) => {
          const el = audioRef.current;
          if (!el) return;
          el.currentTime = Number(v || 0);
          setCur(Number(v || 0));
        }}
        onSeekStart={() => setUserSeeking(true)}
        onSeekEnd={() => setUserSeeking(false)}
      />
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 10, alignItems: "baseline" }}>
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 900 }}>{safeString(value) || "—"}</div>
    </div>
  );
}

function card() {
  return {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 14,
  };
}

function AccountBottomPlayer({
  audioRef,
  track,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  shuffle,
  repeat,
  onToggleShuffle,
  onToggleRepeat,
  dur,
  cur,
  onScrub,
  onSeekStart,
  onSeekEnd,
}) {
  const title = safeString(track?.title) || "No track selected";
  const hasSrc = !!safeString(track?.url);

  return (
    <div style={playerWrap}>
      <div style={playerInner}>
        <button
          onClick={() => onPlayPause(!isPlaying)}
          disabled={!hasSrc}
          style={playBtn(!hasSrc)}
          aria-label="Play pause"
          title={!hasSrc ? "Select a track" : "Play/Pause"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div style={{ minWidth: 0, width: 320 }}>
          <div style={playerTitle}>{title}</div>
          <div style={playerSub}>
            {fmtTime(cur)} / {fmtTime(dur || 0)}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(dur || 0))}
            value={Math.min(Math.floor(cur || 0), Math.max(1, Math.floor(dur || 0)))}
            onPointerDown={onSeekStart}
            onPointerUp={onSeekEnd}
            onChange={(e) => onScrub(Number(e.target.value || 0))}
            style={scrub}
            disabled={!hasSrc}
            aria-label="Scrub"
          />
        </div>

        <div style={playerRight}>
          <button onClick={onToggleShuffle} style={pill(shuffle)} disabled={!hasSrc}>
            Shuffle
          </button>
          <button onClick={onToggleRepeat} style={pill(repeat)} disabled={!hasSrc}>
            Repeat
          </button>

          <button onClick={onPrev} style={navBtn} disabled={!hasSrc} aria-label="Prev">
            ‹‹
          </button>
          <button onClick={onNext} style={navBtn} disabled={!hasSrc} aria-label="Next">
            ››
          </button>
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

const playerWrap = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "14px 16px",
  borderTop: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(24,24,24,0.94)",
  backdropFilter: "blur(12px)",
  zIndex: 50,
};

const playerInner = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const playBtn = (disabled) => ({
  width: 52,
  height: 52,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.18)",
  background: disabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.14)",
  color: "white",
  fontSize: 18,
  fontWeight: 900,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.5 : 1,
});

const playerTitle = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const playerSub = {
  marginTop: 2,
  fontSize: 12,
  opacity: 0.8,
  fontWeight: 800,
};

const scrub = {
  width: "100%",
  appearance: "none",
  height: 6,
  borderRadius: 999,
  background: "rgba(255,255,255,0.18)",
  outline: "none",
};

const playerRight = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const navBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const pill = (active) => ({
  padding: "9px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
});
