// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { loadAlbumBundleByShareId } from "../data/published/loadAlbumBundleByShareId.jsx";

// Minimal fetchJson that hits your server route (recommended) or direct storage if allowed.
async function fetchJson(path) {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) throw new Error(`fetchJson failed: ${res.status} ${path}`);
  return await res.json();
}

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

export default function Product() {
  // Expected route: /shop/product/:shareId
  const shareId = useMemo(() => {
    const m = window.location.pathname.match(/\/shop\/product\/([^/]+)/);
    return m?.[1] || null;
  }, []);

  const [bundle, setBundle] = useState(null);
  const [err, setErr] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        const b = await loadAlbumBundleByShareId({ shareId, fetchJson });
        if (!alive) return;
        setBundle(b);
      } catch (e) {
        if (!alive) return;
        setErr(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [shareId]);

  if (!shareId) {
    return <ErrorPanel title="Missing shareId" details="No shareId in route." />;
  }

  if (err) {
    return (
      <ErrorPanel
        title="Product failed to load published album bundle"
        details={String(err?.message || err)}
      />
    );
  }

  if (!bundle) return <div style={{ padding: 16 }}>Loading…</div>;

  // TEMP DEBUG (remove after Phase 0)
  const dbg = {
    projectId: bundle?.lineage?.projectId,
    masterSavePath: bundle?.lineage?.masterSavePath,
    trackCount: bundle?.album?.tracks?.length,
    firstTrack: bundle?.album?.tracks?.[0]?.title,
    firstAudioPath: bundle?.album?.tracks?.[0]?.audioPath,
    coverArtPath: bundle?.album?.coverArtPath,
  };

  const album = bundle.album;
  const track = album.tracks[activeIdx];

  return (
    <div style={{ padding: 16 }}>
      {/* TEMP DEBUG (remove after Phase 0) */}
      <pre style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
        {JSON.stringify(dbg, null, 2)}
      </pre>

      <div style={{ fontSize: 20, fontWeight: 800 }}>{album.title || "Album"}</div>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>{album.artist || ""}</div>

      {album.coverArtPath ? (
        <img
          src={album.coverArtPath}
          alt="cover"
          style={{ width: 240, height: 240, objectFit: "cover", borderRadius: 12 }}
        />
      ) : null}

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Tracks</div>
        <ol style={{ paddingLeft: 18 }}>
          {album.tracks.map((t, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              <button
                onClick={() => setActiveIdx(i)}
                style={{
                  cursor: "pointer",
                  textDecoration: i === activeIdx ? "underline" : "none",
                }}
              >
                {t.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700 }}>{track.title}</div>
        <audio
          controls
          preload="metadata"
          src={track.audioPath}
          style={{ width: "100%", marginTop: 8 }}
        />
      </div>

      {/* Buy button wiring happens after Phase 2 */}
      <div style={{ marginTop: 16 }}>
        <button disabled style={{ padding: "10px 14px" }}>
          Buy (next)
        </button>
      </div>
    </div>
  );
}
