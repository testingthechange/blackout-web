// src/pages/Shop.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Shop({ backendBase, shareId, onPickTrack }) {
  const [status, setStatus] = useState("no-shareid");
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      return;
    }
    if (!shareId) {
      setStatus("no-shareid");
      return;
    }

    setStatus("loading");

    fetch(`${backendBase}/api/publish/${shareId}/manifest`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error();
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
      id: `published-${manifest.shareId}`,
      albumName: "Published Album",
      artist: "Smart Bridge",
      tracks: manifest.tracks.map((t, i) => ({
        id: `pub-${i}`,
        title: t.title,
        s3Key: t.s3Key, // IMPORTANT: no url here
      })),
    };
  }, [manifest]);

  const productHref = shareId ? `/shop/product/${encodeURIComponent(shareId)}${shareId ? `?shareId=${encodeURIComponent(shareId)}` : ""}` : null;

  return (
    <div style={{ padding: 16 }}>
      <h1>Shop</h1>
      <div style={{ opacity: 0.85 }}>Publish: {status.toUpperCase()}</div>

      {!shareId ? (
        <div style={{ marginTop: 10 }}>
          <div>NO SHAREID</div>
          <div style={{ opacity: 0.8 }}>Add <code>?shareId=YOUR_SHARE_ID</code> to the URL.</div>
        </div>
      ) : null}

      {publishedAlbum ? (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ margin: 0 }}>{publishedAlbum.albumName}</h3>
          <div style={{ opacity: 0.8 }}>{publishedAlbum.artist}</div>

          {productHref ? (
            <div style={{ marginTop: 10 }}>
              <Link to={productHref}>Open Product Page →</Link>
            </div>
          ) : null}

          <div style={{ marginTop: 12 }}>
            {publishedAlbum.tracks.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                <div style={{ width: 24, opacity: 0.7 }}>{i + 1}</div>
                <div style={{ flex: 1, fontWeight: 800 }}>{t.title || "Untitled"}</div>
                <button
                  onClick={() => onPickTrack({ tracks: publishedAlbum.tracks, index: i })}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.10)",
                    color: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  ▶ Preview
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 14, opacity: 0.8 }}>
          {status === "fail" ? "Failed to load publish manifest." : "Waiting…"}
        </div>
      )}
    </div>
  );
}
