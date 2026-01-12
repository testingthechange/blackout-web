import { useEffect, useMemo, useRef, useState } from "react";

export default function FullPlayer({
  track,
  queue = [],
  index = 0,
  onPrev,
  onNext,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [repeat, setRepeat] = useState(false);

  const src = useMemo(() => {
    if (!track) return "";
    return String(track.url || "").trim();
  }, [track]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    setIsPlaying(false);
    setCur(0);
    setDur(0);

    if (!src) {
      el.removeAttribute("src");
      el.load();
      return;
    }

    el.src = src;
    el.currentTime = 0;
    el.load();
  }, [src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, src]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDur(el.duration || 0);
    const onTime = () => setCur(el.currentTime || 0);
    const onEnded = () => {
      if (repeat) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else {
        onNext?.();
      }
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, [repeat, onNext]);

  return (
    <div style={wrap}>
      <div style={inner}>
        <button onClick={() => setIsPlaying((p) => !p)} style={playBtn}>
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <div style={{ flex: 1 }}>
          <div style={title}>{track?.title || "—"}</div>
          <div style={sub}>
            {fmt(cur)} / {fmt(dur)}
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(dur))}
            value={Math.floor(cur)}
            onChange={(e) => {
              const el = audioRef.current;
              if (!el) return;
              const v = Number(e.target.value);
              el.currentTime = v;
              setCur(v);
            }}
            style={{ width: "100%" }}
          />
        </div>

        <button onClick={onPrev} style={iconBtn}>‹‹</button>
        <button onClick={onNext} style={iconBtn}>››</button>
        <button onClick={() => setRepeat((r) => !r)} style={iconBtn}>
          {repeat ? "Repeat ✓" : "Repeat"}
        </button>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}

const fmt = (s) => {
  const sec = Math.floor(s || 0);
  const m = Math.floor(sec / 60);
  const r = String(sec % 60).padStart(2, "0");
  return `${m}:${r}`;
};

const wrap = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  padding: 12,
  background: "#111",
  borderTop: "1px solid #333",
};

const inner = {
  maxWidth: 1200,
  margin: "0 auto",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const playBtn = { width: 44, height: 44, borderRadius: "50%" };
const iconBtn = { padding: "8px 10px", fontWeight: 900 };
const title = { fontWeight: 900 };
const sub = { fontSize: 12, opacity: 0.7 };
