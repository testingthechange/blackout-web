import { useEffect, useMemo, useRef, useState } from "react";

export default function BottomPlayer({
  mode = "preview", // "preview" | "full"
  track,
  queue = [],
  index = 0,

  isPlaying,
  onPlayPause,

  onPrev,
  onNext,

  shuffle = false,
  repeat = false,
  onToggleShuffle,
  onToggleRepeat,

  previewSeconds = 30,
}) {
  const audioRef = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(previewSeconds);

  const title = useMemo(() => (track ? track.title || "Untitled" : "No track selected"), [track]);

  const src = useMemo(() => {
    if (!track) return "";
    return String(track.previewUrl || track.url || "").trim();
  }, [track]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    setSecondsLeft(previewSeconds);
    el.pause();

    if (!src) {
      el.removeAttribute("src");
      el.load();
      return;
    }

    el.src = src;
    el.currentTime = 0;
    el.load();

    if (isPlaying) el.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!src) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => {
      if (mode !== "preview") return;

      const t = el.currentTime || 0;
      const remaining = Math.max(0, Math.ceil(previewSeconds - t));
      setSecondsLeft(remaining);

      if (t >= previewSeconds) {
        el.pause();
        el.currentTime = 0;
        onPlayPause(false);
        onNext?.(); // auto-continue after sample
      }
    };

    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [mode, previewSeconds, onPlayPause, onNext]);

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
      if (mode === "preview") return;
      if (repeat) {
        el.currentTime = 0;
        el.play().catch(() => {});
        return;
      }
      onNext?.();
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [mode, repeat, onNext, userSeeking]);

  const fmt = (s) => {
    const sec = Math.max(0, Math.floor(Number(s || 0)));
    const m = Math.floor(sec / 60);
    const r = String(sec % 60).padStart(2, "0");
    return `${m}:${r}`;
  };

  const canPrevNext = queue.length > 1;

  return (
    <div style={wrap}>
      <div style={inner}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => onPlayPause(!isPlaying)} style={playBtn} aria-label="Play pause">
            <span style={{ color: "#22c55e", fontWeight: 900 }}>{isPlaying ? "❚❚" : "▶"}</span>
          </button>

          <div style={info}>
            <div style={titleStyle}>{title}</div>
            {mode === "preview" ? (
              <div style={sub}>Preview: {secondsLeft}s</div>
            ) : (
              <div style={sub}>
                {fmt(cur)} / {fmt(dur || 0)}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === "full" ? (
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(dur || 0))}
              value={Math.min(Math.floor(cur || 0), Math.max(1, Math.floor(dur || 0)))}
              onPointerDown={() => setUserSeeking(true)}
              onPointerUp={() => setUserSeeking(false)}
              onChange={(e) => {
                const el = audioRef.current;
                if (!el) return;
                const v = Number(e.target.value || 0);
                el.currentTime = v;
                setCur(v);
              }}
              style={scrub}
              aria-label="Scrub"
            />
          ) : (
            <div />
          )}
        </div>

        <div style={rightControls}>
          {mode === "full" ? (
            <>
              <button onClick={onToggleShuffle} style={pill(shuffle)} aria-label="Shuffle">
                Shuffle
              </button>
              <button onClick={onToggleRepeat} style={pill(repeat)} aria-label="Repeat">
                Repeat
              </button>
            </>
          ) : null}

          <button onClick={onPrev} disabled={!canPrevNext} style={iconBtn} aria-label="Prev">
            <span style={{ color: "#22c55e", fontWeight: 900 }}>‹‹</span>
          </button>
          <button onClick={onNext} disabled={!canPrevNext} style={iconBtn} aria-label="Next">
            <span style={{ color: "#22c55e", fontWeight: 900 }}>››</span>
          </button>
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  padding: "14px 16px",
  borderTop: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(32,32,32,0.92)",
  backdropFilter: "blur(12px)",
};

const inner = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const rightControls = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const iconBtn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const playBtn = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.14)",
  color: "white",
  fontSize: 18,
  fontWeight: 900,
  cursor: "pointer",
};

const info = {
  width: 260,
  color: "white",
  minWidth: 0,
};

const titleStyle = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const sub = {
  fontSize: 12,
  opacity: 0.8,
  marginTop: 2,
};

const scrub = {
  width: "100%",
  appearance: "none",
  height: 6,
  borderRadius: 999,
  background: "rgba(255,255,255,0.18)",
  outline: "none",
};

const pill = (active) => ({
  padding: "9px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 12,
});
