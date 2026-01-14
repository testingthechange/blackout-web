// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";

function getShareIdFromQuery() {
  const sp = new URLSearchParams(window.location.search);
  return String(sp.get("shareId") || "").trim();
}

function trim(v) {
  return String(v || "").trim();
}

export default function Product({ backendBase = "", shareId: shareIdProp = "", onPickTrack }) {
  const shareId = useMemo(() => trim(shareIdProp) || getShareIdFromQuery(), [shareIdProp]);

  // Reads the immutable handoff source (manifest.json) directly from S3
  const manifestUrl = useMemo(() => {
    if (!shareId) return "";
    return `https://block-7306-player.s3.us-west-1.amazonaws.com/public/players/${encodeURIComponent(
      shareId
    )}/manifest.json`;
  }, [shareId]);

  const [status, setStatus] = useState("idle"); // idle | missing-shareid | loading | ok | fail
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setManifest(null);
    setErr("");

    if (!shareId) {
      setStatus("missing-shareid");
      return;
    }
    if (!manifestUrl) {
      setStatus("fail");
      setErr("Missing manifest URL");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const r = await fetch(manifestUrl, { cache: "no-store" });
        if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
        const j = await r.json().catch(() => null);
        if (!j) throw new Error("Manifest JSON parse failed");
        if (!cancelled) {
          setManifest(j);
          setStatus("ok");
        }
      } catch (e) {
        if (!cancelled) {
          setStatus("fail");
          setErr(e?.message || String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId, manifestUrl]);

  if (status === "missing-shareid") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Product</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          Missing shareId. Add <code>?shareId=...</code>
        </div>
      </div>
    );
  }

  if (status === "loading") return <div style={{ padding: 16 }}>Loading…</div>;

  if (status === "fail") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>Product</div>
        <div style={{ marginTop: 10, color: "#fca5a5", fontWeight: 900 }}>{err}</div>
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          Manifest:{" "}
          <a href={manifestUrl} target="_blank" rel="noreferrer">
            {manifestUrl}
          </a>
        </div>
      </div>
    );
  }

  if (!manifest) return <div style={{ padding: 16 }}>No manifest</div>;

  const albumTitle = manifest?.album?.title || "Album";
  const artist = manifest?.album?.artist || "";
  const coverUrl = manifest?.album?.coverUrl || "";

  // IMPORTANT: tracks passed to App must include s3Key (audioKey) so App can sign it.
  const tracks = Array.isArray(manifest.tracks)
    ? manifest.tracks.map((t, i) => ({
        title: t?.title || `Track ${t?.slot ?? i + 1}`,
        s3Key: t?.audioKey || "", // backend signs this
      }))
    : [];

  return (
    <div style={{ padding: 18 }}>
      <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 6 }}>Product</div>
      <div style={{ opacity: 0.85, marginBottom: 14 }}>
        {albumTitle}
        {artist ? ` — ${artist}` : ""}
      </div>

      {/* 2-column card layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* LEFT: cover + meta */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Album</div>

          {coverUrl ? (
            <img
              src={coverUrl}
              alt="cover"
              style={{ width: "100%", borderRadius: 14, display: "block" }}
            />
          ) : (
            <div style={{ opacity: 0.75, fontSize: 12 }}>No cover</div>
          )}

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            ShareId: <b>{shareId}</b>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Manifest:{" "}
            <a href={manifestUrl} target="_blank" rel="noreferrer">
              {manifestUrl}
            </a>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            Backend env (signing): {backendBase || "—"}
          </div>
        </div>

        {/* RIGHT: tracklist + play buttons */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontWeight: 900 }}>Tracks</div>
            <div style={{ fontWeight: 900 }}>$9.99</div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Digital album access tied to published snapshot.
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {tracks.length ? (
              tracks.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.15)",
                  }}
                >
                  <div style={{ fontWeight: 900, opacity: 0.95 }}>
                    {i + 1}. {t.title}
                  </div>

                  <button
                    style={btn}
                    onClick={() => {
                      if (!onPickTrack) return;
                      onPickTrack({ tracks, index: i, mode: "album" });
                    }}
                    disabled={!t.s3Key}
                    title={!t.s3Key ? "Missing audioKey" : "Play preview"}
                  >
                    Play
                  </button>
                </div>
              ))
            ) : (
              <div style={{ opacity: 0.75, fontSize: 12 }}>No tracks in manifest</div>
            )}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`/shop?shareId=${encodeURIComponent(shareId)}`} style={btnLink}>
              Back to shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const btn = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const btnLink = {
  ...btn,
  display: "inline-block",
  textDecoration: "none",
};
