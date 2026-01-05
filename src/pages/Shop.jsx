// src/pages/Shop.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const cacheKey = (sid) => `sb:manifest:${sid}`;

export default function Shop({ backendBase, shareId, onPickTrack }) {
  const [status, setStatus] = useState("no-shareid");
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!shareId) {
      setStatus("no-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");

    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("bad manifest");
        localStorage.setItem(cacheKey(shareId), JSON.stringify(j));
        setManifest(j);
        setStatus("ok");
      })
      .catch(() => {
        setManifest(null);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  const publishedAlbum = useMemo(() => {
    if (!manifest?.ok) return null;
    return {
      id: manifest.shareId,
      albumName: "Published Album",
      artist: "Smart Bridge",
      tracks: manifest.tracks.map((t, i) => ({
        id: `pub-${i}`,
        title: t.title,
        url: t.url,
      })),
    };
  }, [manifest]);

  return (
    <div>
      <h1>Shop</h1>
      <div>Publish: {status.toUpperCase()}</div>

      {!shareId ? (
        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Add <code>?shareId=...</code> to the URL, or go directly to{" "}
          <code>/shop/product/&lt;shareId&gt;</code>.
        </div>
      ) : null}

      {publishedAlbum ? (
        <div style={{ marginTop: 12 }}>
          <h3>{publishedAlbum.albumName}</h3>
          <div>{publishedAlbum.artist}</div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <Link to={`/shop/product/${publishedAlbum.id}`}>Go to Product Page →</Link>

            <button onClick={() => onPickTrack?.({ tracks: publishedAlbum.tracks, index: 0 })}>
              Play
            </button>
          </div>
        </div>
      ) : shareId ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>No published manifest loaded.</div>
          <div style={{ opacity: 0.8 }}>If this is a valid shareId, check backend env + publish status.</div>
        </div>
      ) : null}
    </div>
  );
}
