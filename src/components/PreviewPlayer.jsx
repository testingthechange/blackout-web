import { useEffect, useMemo, useRef, useState } from "react";

export default function PreviewPlayer({
  tracks = [], // [{ title, s3Key, url? }]
  index = 0,
  isPlaying = false,

  onPlayPause, // (bool) => void
  onPrev, // () => void
  onNext, // () => void

  previewSeconds = 30,
}) {
  const audioRef = useRef(null);
  const [secondsLeft, setSecondsLeft] = useState(previewSeconds);

  const track = tracks[index] || null;

  const title = useMemo(() => {
    return track ? String(track.title || "Untitled") : "No track selected";
  }, [track]);

  const src = useMemo(() => {
    if (!track) return "";
    return String(track.url || "").trim();
  }, [track]);

  // Load new src when track changes
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    setSecondsLeft(previewSeconds);

    if (!src) {
      el.pause();
      el.removeAttribute("src");
      el.load();
      return;
    }

    el.pause();
    el.src = src;
    el.currentTime = 0;
    el.load();

    if (isPlaying) {
      el.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // External play/pause control
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!src) return;

    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, src]);

  // Preview limiter + auto-advance
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => {
      if (!isPlaying) return;

      const t = Number(el.currentTime || 0);
      const remaining = Math.max(0, Math.ceil(previewSeconds - t));
      setSecondsLeft(remaining);

      if (t >= previewSeconds) {
        // keep playing continuously: advance
        onNext?.();
      }
    };

    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [previewSeconds, onNext, isPlaying]);

  const canPrevNext = tracks.length > 1;

  return (
    <div style={wrap}>
      <div style={inner}>
        <button
          onClick={() => onPlayPause?.(!isPlaying)}
          style={btnCircle}
          disabled={!track || !src}
          title={!src ? "Track not ready yet" : "Play/Pause"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={titleStyle}>{title}</div>
          <div style={subStyle}>Preview: {secondsLeft}s</div>
        </div>

        <button onClick={onPrev} disabled={!canPrevNext} style={btnPill}>
          Prev
        </button>
        <button onClick={onNext} disabled={!canPrevNext} style={btnPill}>
          Next
        </button>

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
  borderTop: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(36,36,36,0.92)",
  backdropFilter: "blur(10px)",
};

const inner = {
  maxWidth: 900,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const btnCircle = {
  width: 48,
  height: 48,
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const btnPill = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const titleStyle = {
  fontWeight: 900,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const subStyle = {
  marginTop: 2,
  fontSize: 12,
  opacity: 0.8,
};
