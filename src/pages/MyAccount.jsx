import { useEffect, useMemo, useRef, useState } from "react";

function mmss(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds || 0)));
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, "0");
  return `${m}:${r}`;
}

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          width: "min(760px, 100%)",
          background: "rgba(24,24,24,0.98)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 16,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              borderRadius: 10,
              padding: "6px 10px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function onDown(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose?.();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ref, onClose]);
}

export default function MyAccount({ backendBase, shareId, onPickTrack }) {
  const [status, setStatus] = useState("idle"); // idle | missing-env | missing-shareid | loading | ok | fail
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  // kebab menu
  const [openMenuKey, setOpenMenuKey] = useState(null);

  // modal
  const [modal, setModal] = useState(null); // { type: "lyrics"|"credits", track }

  // --- Load manifest (published) ---
  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!shareId) {
      setStatus("missing-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");
    setErr(null);

    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
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

  // Tracks for Account page + global player
  const tracks = useMemo(() => {
    if (!manifest?.ok) return [];
    return manifest.tracks.map((t, i) => ({
      id: `trk-${i}`,
      slot: Number(t.slot || i + 1),
      title: String(t.title || "").trim() || "Untitled",
      s3Key: String(t.s3Key || "").trim(),
      durationSec: Number(t.durationSec || 0),
      lyrics: t.lyrics,
      credits: t.credits,
      // allow future names too (in case backend uses different keys later)
      lyricsText: t.lyricsText,
      creditsText: t.creditsText,
    }));
  }, [manifest]);

  // ---- Meta getters (ready for incoming snapshot meta) ----
  function getLyrics(track) {
    return (
      String(track?.lyricsText || track?.lyrics || "") ||
      String(manifest?.metaBySlot?.[Number(track?.slot || 0)]?.lyrics || "")
    );
  }

  function getCredits(track) {
    return (
      String(track?.creditsText || track?.credits || "") ||
      String(manifest?.metaBySlot?.[Number(track?.slot || 0)]?.credits || "")
    );
  }

  // --- UI states ---
  if (status === "missing-env") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Account</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>Missing backend env (VITE_ALBUM_BACKEND_URL).</div>
      </div>
    );
  }

  if (status === "missing-shareid") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Account</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          Missing shareId. Add <code>?shareId=...</code>.
        </div>
      </div>
    );
  }

  if (status === "fail") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Account</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid rgba(255,0,0,0.45)", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Failed to load account album</div>
          <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{String(err?.message || err)}</div>
        </div>
      </div>
    );
  }

  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const green = "#22c55e";

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Account</div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 16,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Your Album</div>

        <div style={{ display: "grid", gap: 8 }}>
          {tracks.map((t, i) => {
            const timeStr = t.durationSec ? mmss(t.durationSec) : "--:--";

            return (
              <TrackRow
                key={t.id}
                track={t}
                timeStr={timeStr}
                isMenuOpen={openMenuKey === t.s3Key}
                onOpenMenu={() => setOpenMenuKey((k) => (k === t.s3Key ? null : t.s3Key))}
                onCloseMenu={() => setOpenMenuKey(null)}
                onPlay={() => {
                  // IMPORTANT: use the existing global player
                  onPickTrack?.({ tracks, index: i });
                  setOpenMenuKey(null);
                }}
                onLyrics={() => {
                  setModal({ type: "lyrics", track: t });
                  setOpenMenuKey(null);
                }}
                onCredits={() => {
                  setModal({ type: "credits", track: t });
                  setOpenMenuKey(null);
                }}
                accent={green}
              />
            );
          })}
        </div>
      </div>

      {modal ? (
        <Modal
          title={`${modal.type === "lyrics" ? "Lyrics" : "Credits"} — ${modal.track?.title || "Track"}`}
          onClose={() => setModal(null)}
        >
          {modal.type === "lyrics" ? (
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.35, opacity: 0.92 }}>
              {getLyrics(modal.track) || "Lyrics pending (will populate from published snapshot meta)."}
            </pre>
          ) : (
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.35, opacity: 0.92 }}>
              {getCredits(modal.track) || "Credits pending (will populate from published snapshot meta)."}
            </pre>
          )}
        </Modal>
      ) : null}
    </div>
  );
}

function TrackRow({ track, timeStr, isMenuOpen, onOpenMenu, onCloseMenu, onPlay, onLyrics, onCredits, accent }) {
  const menuRef = useRef(null);
  useOutsideClose(menuRef, () => {
    if (isMenuOpen) onCloseMenu?.();
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 10px",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ width: 26, opacity: 0.7, fontWeight: 900 }}>{track.slot}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {track.title} <span style={{ opacity: 0.72, fontWeight: 800 }}>({timeStr})</span>
        </div>
      </div>

      {/* 3-dot menu */}
      <div style={{ position: "relative" }} ref={menuRef}>
        <button
          onClick={onOpenMenu}
          aria-label="Track menu"
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            fontWeight: 900,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <span style={{ letterSpacing: 1, color: accent }}>⋯</span>
        </button>

        {isMenuOpen ? (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 48,
              width: 220,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(18,18,18,0.98)",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
              zIndex: 50,
            }}
          >
            <MenuItem label="Play" onClick={onPlay} accent={accent} />
            <MenuItem label="Lyrics" onClick={onLyrics} accent={accent} />
            <MenuItem label="Credits" onClick={onCredits} accent={accent} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MenuItem({ label, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "11px 12px",
        border: "none",
        background: "transparent",
        color: "white",
        cursor: "pointer",
        fontWeight: 900,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: accent }}>{label}</span>
    </button>
  );
}
      <Route
        path="/account"
        element={
          <MyAccount
            backendBase={BACKEND_BASE}
            shareId={shareId}
            onPickTrack={setPlayContext}
          />
        }
      />
