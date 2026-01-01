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
  const [secondsLeft, setSecondsLeft] = useState(previewSeconds);

  const title = useMemo(
    () => (track ? track.title || "Untitled" : "No track selected"),
    [track]
  );

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track?.previewUrl) return;

    el.pause();
    el.src = track.previewUrl;
    el.currentTime = 0;
    el.load();

    if (isPlaying) el.play();
  }, [track?.previewUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    isPlaying ? el.play() : el.pause();
  }, [isPlaying]);

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

    el.addEventListener("timeupdate", onTime);
    return () => el.removeEventListener("timeupdate", onTime);
  }, [previewSeconds, onPlayPause]);

  return (
    <div style={wrap}>
      <div style={inner}>
        <div style={controls}>
          <button onClick={onPrev} style={iconBtn}>‹‹</button>
          <button onClick={() => onPlayPause(!isPlaying)} style={playBtn}>
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <button onClick={onNext} style={iconBtn}>››</button>
        </div>

        <div style={info}>
          <div style={titleStyle}>{title}</div>
          <div style={sub}>Preview: {secondsLeft}s</div>
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

const controls = {
  display: "flex",
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
  flex: 1,
  color: "white",
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
};
