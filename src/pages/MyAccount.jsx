// FILE: blackout-web/src/pages/MyAccount.jsx
// NOTE: This file is only changed to (1) show album meta + (2) show cover (signed if needed)
// and (3) hide empty slots if backend returns them (defensive).
// Paste this in full ONLY if you want these UI updates immediately.
// If you already have heavy MyAccount logic, do NOT replace it; instead copy the marked sections.

import { useEffect, useMemo, useState } from "react";

export default function MyAccount({ backendBase: backendBaseProp, shareId: shareIdProp, onPickTrack }) {
  const backendBase = String(backendBaseProp || import.meta.env.VITE_ALBUM_BACKEND_URL || "").trim();

  // shareId: prefer prop, else querystring
  const shareId = useMemo(() => {
    const s = String(shareIdProp || "").trim();
    if (s) return s;
    const sp = new URLSearchParams(window.location.search);
    return String(sp.get("shareId") || "").trim();
  }, [shareIdProp]);

  const [status, setStatus] = useState("idle"); // idle | missing-env | missing-shareid | loading | ok | fail
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  // cover: if coverUrl exists use it; else sign coverS3Key via playback-url
  const [coverSignedUrl, setCoverSignedUrl] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setCoverSignedUrl("");

      if (!manifest || !backendBase) return;

      const coverUrl = String(manifest?.coverUrl || "").trim();
      if (coverUrl) {
        setCoverSignedUrl(coverUrl);
        return;
      }

      const coverS3Key = String(manifest?.coverS3Key || "").trim();
      if (!coverS3Key) return;

      try {
        const r = await fetch(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(coverS3Key)}`, {
          cache: "no-store",
        });
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        if (!cancelled) setCoverSignedUrl(String(j?.url || ""));
      } catch {
        // ignore
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [manifest, backendBase]);

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

  const albumName = String(manifest?.albumName || "Album");
  const performers = String(manifest?.performers || "");
  const releaseDate = String(manifest?.releaseDate || "");

  // Defensive: filter empty s3Key tracks (even though backend now does this)
  const tracks = (Array.isArray(manifest?.tracks) ? manifest.tracks : []).filter((t) => String(t?.s3Key || "").trim());

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>Account</div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "stretch" }}>
        <div
          style={{
            flex: "1 1 340px",
            minWidth: 280,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          {coverSignedUrl ? (
            <img
              src={coverSignedUrl}
              alt="Album cover"
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                display: "block",
                marginBottom: 12,
              }}
            />
          ) : (
            <div
              style={{
                height: 220,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                opacity: 0.85,
                fontWeight: 900,
              }}
            >
              No cover
            </div>
          )}

          <div style={{ fontWeight: 900 }}>{albumName}</div>
          {performers ? <div style={{ opacity: 0.85, marginTop: 4 }}>{performers}</div> : null}
          {releaseDate ? <div style={{ opacity: 0.75, marginTop: 4, fontSize: 12 }}>{releaseDate}</div> : null}

          <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
            Source: <code>/api/publish/{shareId}/manifest</code>
          </div>
        </div>

        <div
          style={{
            flex: "1 1 340px",
            minWidth: 280,
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Tracks</div>

          {tracks.length === 0 ? (
            <div style={{ opacity: 0.85 }}>No playable tracks (missing s3Key).</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tracks.map((t, idx) => {
                const slot = Number(t?.slot ?? idx + 1);
                const title = String(t?.title || `Track ${slot}`);
                return (
                  <button
                    key={`${slot}-${idx}`}
                    style={{
                      textAlign: "left",
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      padding: 10,
                      background: "rgba(0,0,0,0.20)",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                    onClick={() => onPickTrack?.({ tracks, index: idx, mode: "album" })}
                  >
                    {slot}. {title}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
