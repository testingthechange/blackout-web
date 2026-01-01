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
}) {
  const audioRef = useRef(null);
  const [error, setError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(previewSeconds);

  const trackLabel = useMemo(() => (track ? track.title || "Untitled" : "No track selected"), [track]);

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

    if (isPlaying) el.play().catch((e) => setError(e?.message || "Audio play failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.previewUrl]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track?.previewUrl) return;
    if (isPlaying) el.play().catch((e) => setError(e?.message || "Audio play failed"));
    else el.pause();
  }, [isPlaying, track?.previewUrl]);

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
      if (repeat && track?.previewUrl) {
        el.currentTime = 0;
        el.play().catch(() => {});
        return;
      }
      onNext();
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [previewSeconds, onNext, onPlayPause, repeat, track?.previewUrl]);

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        padding: "12px 14px",
        borderTop: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => onPlayPause(!isPlaying)} style={btn}>{isPlaying ? "Pause" : "Play"}</button>
        <button onClick={onToggleShuffle} style={{ ...btn, opacity: shuffle ? 1 : 0.7 }}>Shuffle</button>
        <button onClick={onToggleRepeat} style={{ ...btn, opacity: repeat ? 1 : 0.7 }}>Repeat</button>
        <button onClick={onPrev} style={btn}>Prev</button>
        <button onClick={onNext} style={btn}>Next</button>

        <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900, marginLeft: 8, flex: 1, minWidth: 0 }}>
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{trackLabel}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Preview: {secondsLeft}s left{error ? <span style={{ marginLeft: 10, color: "#ffb3b3" }}>({error})</span> : null}
          </div>
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

const btn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
};
