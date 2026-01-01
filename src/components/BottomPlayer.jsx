import { useEffect, useMemo, useRef, useState } from "react";

export default function BottomPlayer({
  track,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  previewSeconds = 30,
}) {
  const audioRef = useRef(null);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(previewSeconds);

  const title = useMemo(() => (track ? track.title || "Untitled" : "No track selected"), [track]);

  // Load audio when track changes
  useEffect(() => {
    setError("");
    setSecondsLeft(previewSeconds);

    const el = audioRef.current;
    if (!el) return;

    if (!track?.previewUrl) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      return;
    }

    el.pause();
    el.src = track.previewUrl;
    el.currentTime = 0;
    el.load();

    if (isPlaying) {
      el.play().catch((e) => setError(e?.message || "Audio play failed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.previewUrl]);

  // React to play/pause state
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track?.previewUrl) return;

    if (isPlaying) {
      el.play().catch((e) => setError(e?.message || "Audio play failed"));
    } else {
      el.pause();
    }
  }, [isPlaying, track?.previewUrl]);

  // 30s preview cap
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => {
      const t = el.currentTime || 0;
      const remaining = Math.max(0, Math.ceil(previewSeconds - t));
      setSecondsLeft(remaining);

      if (t >= previewSeconds) {
        el.pause();
        el.currentTime = 0;
        onPlayPause(false);
      }
    };

    const onEnded = () => {
      onNext();
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [previewSeconds, onNext, onPlayPause]);

  const playDisabled = !track?.previewUrl;

  return (
    <div style={wrap}>
      <div style={inner}>
        {/* LEFT controls */}
        <div style={leftControls}>
          <button onClick={onPrev} style={iconBtn} aria-label="Previous">
            ‹‹
          </button>

          <button
            onClick={() => onPlayPause(!isPlaying)}
            style={{ ...playBtn, opacity: playDisabled ? 0.5 : 1, cursor: playDisabled ? "not-allowed" : "pointer" }}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={playDisabled}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>

          <button onClick={onNext} style={iconBtn} aria-label="Next">
            ››
          </button>
        </div>

        {/* CENTER info */}
        <div style={info}>
          <div style={trackTitle}>{title}</div>
          <div style={sub}>
            Preview: {secondsLeft}s left
            {error ? <span style={{ marginLeft: 10, color: "#ffb3b3" }}>({error})</span> : null}
          </div>
        </div>

        {/* RIGHT spacer (future area) */}
        <div style={{ width: 120 }} />

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

const wrap = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  padding: "14px 16px",
  borderTop: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(12px)",
};

const inner = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const leftControls = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexShrink: 0,
};

const iconBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 1000,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
  minWidth: 52,
};

const playBtn = {
  width: 52,
  height: 52,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.12)",
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 1000,
  fontSize: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const info = {
  flex: 1,
  minWidth: 0,
  color: "white",
  fontFamily: "system-ui",
};

const trackTitle = {
  fontWeight: 950,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const sub = {
  fontSize: 12,
  opacity: 0.82,
  marginTop: 2,
};
