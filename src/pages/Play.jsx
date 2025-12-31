// minisite/src/pages/Play.jsx
import { useEffect, useState } from "react";

/**
 * Manifest v1 contract:
 * {
 *   version: 1,
 *   title: string,
 *   artist: string,
 *   cover?: string,
 *   tracks: [
 *     { id: string, title: string, s3Key: string, duration?: number }
 *   ]
 * }
 */

export default function Play() {
  const params = new URLSearchParams(window.location.search);
  const shareId = params.get("shareId");

  const [manifest, setManifest] = useState(null);
  const [manifestStatus, setManifestStatus] = useState("idle");
  const [manifestError, setManifestError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);

  const [audioUrl, setAudioUrl] = useState("");
  const [audioStatus, setAudioStatus] = useState("idle");
  const [audioError, setAudioError] = useState("");

  /* ------------------ load manifest ------------------ */
  useEffect(() => {
    if (!shareId) {
      setManifestStatus("error");
      setManifestError("Missing shareId");
      return;
    }

    let cancelled = false;

    async function loadManifest() {
      try {
        setManifestStatus("loading");
        setManifestError("");

        const res = await fetch(`/api/manifest?shareId=${encodeURIComponent(shareId)}`);
        const data = await res.json();

        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load manifest");
        if (!data.manifest?.tracks?.length) throw new Error("Manifest has no tracks");

        if (!cancelled) {
          setManifest(data.manifest);
          setActiveIndex(0);
          setManifestStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setManifestStatus("error");
          setManifestError(err.message || String(err));
        }
      }
    }

    loadManifest();
    return () => { cancelled = true; };
  }, [shareId]);

  /* ------------------ sign active track ------------------ */
  useEffect(() => {
    if (manifestStatus !== "ready") return;

    const track = manifest?.tracks?.[activeIndex];
    if (!track?.s3Key) {
      setAudioStatus("error");
      setAudioError("Selected track is missing s3Key");
      return;
    }

    let cancelled = false;

    async function signAudio() {
      try {
        setAudioStatus("loading");
        setAudioError("");
        setAudioUrl("");

        const res = await fetch(`/api/playback-url?s3Key=${encodeURIComponent(track.s3Key)}`);
        const data = await res.json();

        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to sign audio URL");

        if (!cancelled) {
          setAudioUrl(data.url);
          setAudioStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setAudioStatus("error");
          setAudioError(err.message || String(err));
        }
      }
    }

    signAudio();
    return () => { cancelled = true; };
  }, [manifestStatus, manifest, activeIndex]);

  /* ------------------ render ------------------ */
  return (
    <div style={{ padding: 40, color: "white", fontFamily: "system-ui", maxWidth: 900 }}>
      <h1 style={{ marginTop: 0 }}>Play</h1>

      <div style={{ opacity: 0.85, marginBottom: 16 }}>
        <div>shareId: {shareId}</div>
      </div>

      {manifestStatus === "loading" && <p>Loading release…</p>}

      {manifestStatus === "error" && (
        <div>
          <p style={{ color: "#ff8080" }}>Failed to load release</p>
          <pre style={{ whiteSpace: "pre-wrap", opacity: 0.85 }}>{manifestError}</pre>
        </div>
      )}

      {manifestStatus === "ready" && (
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          {/* Track list */}
          <div
            style={{
              width: 320,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{manifest.title}</div>
              <div style={{ opacity: 0.8, marginTop: 4 }}>{manifest.artist}</div>
              <div style={{ opacity: 0.6, marginTop: 8, fontSize: 12 }}>
                {manifest.tracks.length} track{manifest.tracks.length === 1 ? "" : "s"}
              </div>
            </div>

            <div>
              {manifest.tracks.map((t, i) => {
                const active = i === activeIndex;
                return (
                  <button
                    key={t.id || `${i}`}
                    onClick={() => setActiveIndex(i)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      background: active ? "rgba(255,255,255,0.12)" : "transparent",
                      color: "white",
                      border: "none",
                      borderBottom:
                        i === manifest.tracks.length - 1 ? "none" : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 600, opacity: active ? 1 : 0.9 }}>
                        {i + 1}. {t.title || "(untitled)"}
                      </div>
                      {typeof t.duration === "number" && (
                        <div style={{ opacity: 0.7, fontSize: 12 }}>
                          {Math.floor(t.duration / 60)}:{String(t.duration % 60).padStart(2, "0")}
                        </div>
                      )}
                    </div>
                    <div style={{ opacity: 0.55, fontSize: 12, marginTop: 4, wordBreak: "break-all" }}>
                      {t.s3Key}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player */}
          <div
            style={{
              flex: 1,
              padding: 20,
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12,
              minHeight: 180,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Player</h2>

            <p style={{ opacity: 0.9, marginTop: 8 }}>
              Now playing:{" "}
              <strong>{manifest.tracks[activeIndex]?.title || "(untitled)"}</strong>
            </p>

            {audioStatus === "loading" && <p>Preparing audio…</p>}

            {audioStatus === "error" && (
              <div>
                <p style={{ color: "#ff8080" }}>Playback error</p>
                <pre style={{ whiteSpace: "pre-wrap", opacity: 0.85 }}>{audioError}</pre>
              </div>
            )}

            {audioStatus === "ready" && (
              <audio controls style={{ width: "100%" }} preload="metadata">
                <source src={audioUrl} />
              </audio>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
