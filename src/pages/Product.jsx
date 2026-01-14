// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";
import { loadAlbumBundleByShareId } from "../data/published/loadAlbumBundleByShareId.js";
import { buildAlbumBundle } from "../selectors/buildAlbumBundle.js";

function getShareIdFromQuery() {
  const sp = new URLSearchParams(window.location.search);
  return String(sp.get("shareId") || "").trim();
}

export default function Product({ shareId: shareIdProp = "" }) {
  const shareId = useMemo(() => String(shareIdProp || getShareIdFromQuery()).trim(), [shareIdProp]);

  const [album, setAlbum] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shareId) {
      setErr("Missing shareId");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErr("");
    setAlbum(null);

    (async () => {
      try {
        const manifest = await loadAlbumBundleByShareId(shareId);
        const bundle = buildAlbumBundle(manifest);
        if (!cancelled) setAlbum(bundle);
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  if (loading) return <div style={{ padding: 24 }}>Loading album…</div>;
  if (err) return <div style={{ padding: 24, color: "#b91c1c", fontWeight: 900 }}>{err}</div>;
  if (!album) return <div style={{ padding: 24 }}>No album</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        ShareId: <b>{album.shareId}</b>
      </div>

      <h1 style={{ marginTop: 12 }}>{album.meta.title || "Album"}</h1>

      {album.cover.url ? (
        <img src={album.cover.url} alt="cover" style={{ maxWidth: 320, borderRadius: 12 }} />
      ) : null}

      <div style={{ marginTop: 20 }}>
        {album.tracks.map((t) => (
          <div key={t.slot} style={{ marginBottom: 8 }}>
            {t.slot}. {t.title}
          </div>
        ))}
      </div>
    </div>
  );
}
