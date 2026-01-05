// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";
import PreviewPlayer from "../components/PreviewPlayer.jsx";

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec || 0)));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

async function probeDuration(url) {
  return await new Promise((resolve) => {
    try {
      const a = new Audio();
      a.preload = "metadata";
      a.src = url;

      const done = (v) => resolve(v);

      a.addEventListener("loadedmetadata", () => {
        const d = Number(a.duration || 0);
        done(d > 0 && Number.isFinite(d) ? d : 0);
      });
      a.addEventListener("error", () => done(0));

      // Safari sometimes needs load()
      a.load();

      // Hard stop
      setTimeout(() => done(0), 2500);
    } catch {
      resolve(0);
    }
  });
}

export default function Product({ backendBase, onBuy }) {
  const shareId = useMemo(() => {
    const m = window.location.pathname.match(/\/shop\/product\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }, []);

  const [status, setStatus] = useState("loading");
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  // page-only preview player state
  const [queue, setQueue] = useState([]); // [{ id,title,s3Key,url? }]
  const [idx, setIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // durations keyed by s3Key
  const [durByKey, setDurByKey] = useState({}); // { [s3Key]: seconds }

  // per-row three-dot menu open state
  const [menuOpenKey, setMenuOpenKey] = useState("");

  const signedCache = useMemo(() => new Map(), []);

  // load manifest
  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      return;
    }
    if (!shareId) {
      setStatus("missing-shareid");
      return;
    }

    setStatus("loading");
    setErr(null);
    setManifest(null);

    fetchJson(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`)
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("manifest missing tracks");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setManifest(null);
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  const tracks = useMemo(() => {
    if (!manifest?.ok) return [];
    return manifest.tracks.map((t, i) => ({
      id: `trk-${i}`,
      title: String(t.title || "").trim(),
      s3Key: String(t.s3Key || "").trim(),
      url: "",
    }));
  }, [manifest]);

  // sync queue with tracks (preserve any signed urls)
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

  async function ensureDurationFor(trackWithUrl) {
    const s3Key = String(trackWithUrl?.s3Key || "").trim();
    const url = String(trackWithUrl?.url || "").trim();
    if (!s3Key || !url) return;

    // already have it
    if (durByKey[s3Key]) return;

    const d = await probeDuration(url);
    if (d > 0) {
      setDurByKey((p) => ({ ...p, [s3Key]: d }));
    }
  }

  // Click title to play (no play button)
  async function playAt(i) {
    if (!queue.length) return;
    const nextI = Math.max(0, Math.min(i, queue.length - 1));
    const t = await signTrackIfNeeded(queue[nextI]);

    setQueue((prev) => prev.map((x, k) => (k === nextI ? t : x)));
    setIdx(nextI);
    setIsPlaying(true);

    // probe duration after signing
    ensureDurationFor(t);
  }

  async function goPrev() {
    if (!queue.length) return;
    const nextI = idx > 0 ? idx - 1 : queue.length - 1;
    const t = await signTrackIfNeeded(queue[nextI]);
    setQueue((prev) => prev.map((x, k) => (k === nextI ? t : x)));
    setIdx(nextI);
    setIsPlaying(true);
    ensureDurationFor(t);
  }

  async function goNext() {
    if (!queue.length) return;
    const nextI = (idx + 1) % queue.length;
    const t = await signTrackIfNeeded(queue[nextI]);
    setQueue((prev) => prev.map((x, k) => (k === nextI ? t : x)));
    setIdx(nextI);
    setIsPlaying(true);
    ensureDurationFor(t);
  }

  if (!shareId) return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  if (status === "missing-env") return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  if (status === "fail") return <ErrorPanel title="Failed to load product" details={String(err?.message || err)} />;
  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const active = queue[idx] || null;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      {/* 2-col layout: left is ~25% wider than right */}
      <div style={grid}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Product</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 900 }}>Published Album</div>
            <div style={{ marginTop: 6, opacity: 0.85 }}>ShareId: <code>{shareId}</code></div>
            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
              Click a track title to play a 30s preview. Previews auto-advance to the next track.
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Now Playing</div>
            <div style={{ marginTop: 8, fontWeight: 900, fontSize: 16 }}>
              {active?.title || "—"}
              {active?.s3Key && durByKey[active.s3Key] ? (
                <span style={{ opacity: 0.75, marginLeft: 8 }}>
                  ({fmtTime(durByKey[active.s3Key])})
                </span>
              ) : null}
            </div>
            <div style={{ marginTop: 6, opacity: 0.8, fontSize: 12 }}>
              Track {queue.length ? idx + 1 : 0} of {queue.length || 0}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Stack three cards */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Details</div>
            <div style={{ marginTop: 8, opacity: 0.85, fontSize: 13 }}>
              Project: <code>{String(manifest.projectId || "")}</code>
            </div>
            <div style={{ marginTop: 6, opacity: 0.85, fontSize: 13 }}>
              Published: <code>{String(manifest.publishedAt || "")}</code>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Purchase</div>
            <button
              onClick={() => onBuy?.(shareId)}
              style={btnPrimary}
            >
              Buy
            </button>
            <div style={{ marginTop: 8, opacity: 0.75, fontSize: 12 }}>
              (Placeholder)
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Actions</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button
                type="button"
                style={btnGhost}
                onClick={() => {
                  navigator.clipboard?.writeText(shareId).catch(() => {});
                }}
              >
                Copy ShareId
              </button>
              <button
                type="button"
                style={btnGhost}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href).catch(() => {});
                }}
              >
                Copy Link
              </button>
            </div>
          </div>

          {/* Tracks card at bottom */}
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>Tracks</div>
            </div>

            <div>
              {queue.map((t, i) => {
                const isActive = i === idx;
                const dur = t.s3Key ? durByKey[t.s3Key] : 0;

                return (
                  <div key={t.id} style={row(isActive)}>
                    <div style={{ width: 30, opacity: 0.7, fontWeight: 900, textAlign: "right" }}>
                      {i + 1}
                    </div>

                    <button
                      type="button"
                      onClick={() => playAt(i)}
                      style={titleBtn(isActive)}
                      title="Click to play preview"
                    >
                      {t.title || "Untitled"}{" "}
                      <span style={{ opacity: 0.75 }}>
                        ({dur ? fmtTime(dur) : "--:--"})
                      </span>
                    </button>

                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => setMenuOpenKey((p) => (p === t.s3Key ? "" : t.s3Key))}
                        style={dotsBtn}
                        aria-label="More"
                        title="More"
                      >
                        ⋯
                      </button>

                      {menuOpenKey === t.s3Key ? (
                        <div style={menu}>
                          <button
                            type="button"
                            style={menuItem}
                            onClick={() => {
                              navigator.clipboard?.writeText(String(t.s3Key || "")).catch(() => {});
                              setMenuOpenKey("");
                            }}
                          >
                            Copy s3Key
                          </button>
                          <button
                            type="button"
                            style={menuItem}
                            onClick={() => {
                              setMenuOpenKey("");
                            }}
                          >
                            Close
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Page-only preview player */}
      {queue.length ? (
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

const grid = {
  display: "grid",
  gridTemplateColumns: "1.25fr 1fr", // left ~25% wider than right
  gap: 14,
  alignItems: "start",
};

const card = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 14,
  padding: 14,
};

const btnPrimary = {
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.14)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const btnGhost = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const row = (active) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  background: active ? "rgba(255,255,255,0.07)" : "transparent",
});

const titleBtn = (active) => ({
  flex: 1,
  textAlign: "left",
  background: "transparent",
  border: "none",
  padding: 0,
  color: "white",
  fontWeight: active ? 900 : 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const dotsBtn = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const menu = {
  position: "absolute",
  right: 0,
  top: 40,
  width: 160,
  background: "rgba(20,20,20,0.98)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  overflow: "hidden",
  zIndex: 30,
};

const menuItem = {
  width: "100%",
  padding: "10px 12px",
  textAlign: "left",
  background: "transparent",
  border: "none",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
