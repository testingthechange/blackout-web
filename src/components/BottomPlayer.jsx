import { useEffect, useMemo, useRef, useState } from "react";

export default function BottomPlayer({
  track,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  shuffle,
  onToggleShuffle,
  repeat,
  onToggleRepeat,
  previewSeconds = 30,
  paid = false,
}) {
  const audioRef = useRef(null);

  const [duration, setDuration] = useState(0);
  const [pos, setPos] = useState(0);

  const title = useMemo(() => (track ? track.title || "Untitled" : "No track selected"), [track]);
  const src = track?.previewUrl || track?.url || "";

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;

    el.pause();
    el.src = src;
    el.currentTime = 0;
    el.load();
    setPos(0);
    setDuration(0);

    if (isPlaying) el.play().catch(() => {});
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : 0);

    const onTime = () => {
      const t = el.currentTime || 0;
      setPos(t);

      if (!paid && previewSeconds && t >= previewSeconds) {
        el.pause();
        el.currentTime = 0;
        setPos(0);
        onPlayPause(false);
      }
    };

    const onEnded = () => {
      if (repeat) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else {
        onNext?.();
      }
    };

    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [onPlayPause, onNext, previewSeconds, paid, repeat]);

  const shownDuration = useMemo(() => {
    if (!paid && previewSeconds) return Math.min(duration || previewSeconds, previewSeconds);
    return duration || 0;
  }, [duration, paid, previewSeconds]);

  const shownPos = useMemo(() => {
    if (!paid && previewSeconds) return Math.min(pos || 0, previewSeconds);
    return pos || 0;
  }, [pos, paid, previewSeconds]);

  const fmt = (s) => {
    if (!Number.isFinite(s) || s < 0) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, "0")}`;
  };

  const scrubTo = (next) => {
    const el = audioRef.current;
    if (!el) return;

    const max = shownDuration || 0;
    const clamped = Math.max(0, Math.min(next, max));
    el.currentTime = clamped;
    setPos(clamped);
  };

  return (
    <div style={wrap}>
      <div style={inner}>
        <button onClick={() => onPlayPause(!isPlaying)} style={playBtn} aria-label="Play / Pause" disabled={!src}>
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div style={mid}>
          <div style={titleStyle}>{title}</div>

          <div style={barRow}>
            <div style={timeText}>{fmt(shownPos)}</div>
            <input
              type="range"
              min={0}
              max={Math.max(0, shownDuration || 0)}
              step={0.1}
              value={shownPos}
              onChange={(e) => scrubTo(Number(e.target.value))}
              style={range}
              aria-label="Scrub"
              disabled={!src}
            />
            <div style={timeText}>{fmt(shownDuration)}</div>
          </div>
        </div>

        <div style={rightControls}>
          <button onClick={onToggleShuffle} style={{ ...pillBtn, opacity: shuffle ? 1 : 0.75 }} aria-label="Shuffle">
            Shuffle
          </button>
          <button onClick={onToggleRepeat} style={{ ...pillBtn, opacity: repeat ? 1 : 0.75 }} aria-label="Repeat">
            Repeat
          </button>
          <button onClick={onPrev} style={iconBtn} aria-label="Previous">
            ‹‹
          </button>
          <button onClick={onNext} style={iconBtn} aria-label="Next">
            ››
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
  gap: 14,
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
  flex: "0 0 auto",
};

const mid = {
  flex: 1,
  minWidth: 0,
  color: "white",
};

const titleStyle = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginBottom: 8,
};

const barRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const timeText = {
  fontSize: 12,
  opacity: 0.85,
  fontWeight: 900,
  width: 44,
  textAlign: "center",
  flex: "0 0 auto",
};

const range = {
  flex: 1,
  width: "100%",
};

const rightControls = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flex: "0 0 auto",
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

const pillBtn = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};
