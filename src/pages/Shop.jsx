import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const cacheKey = (sid) => `sb:manifest:${sid}`;

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export default function Shop({ backendBase, shareId, onPickTrack }) {
  const [status, setStatus] = useState("no-shareid"); // missing-env | no-shareid | loading | ok | fail
  const [manifest, setManifest] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");

    if (!backendBase) {
      setManifest(null);
      setStatus("missing-env");
      return;
    }
    if (!shareId) {
      setManifest(null);
      setStatus("no-shareid");
      return;
    }

    setStatus("loading");

    fetch(`${backendBase}/api/publish/${shareId}/manifest`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Manifest fetch failed (${r.status})`);
        const j = await r.json();
        if (!j?.ok || !Array.isArray(j.tracks)) {
          throw new Error("Invalid manifest shape");
        }
        localStorage.setItem(cacheKey(shareId), JSON.stringify(j));
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        // If live fetch fails, try cached manifest so the UI doesn't fall back to demo.
        const cached = safeParse(localStorage.getItem(cacheKey(shareId)) || "");
        if (cached?.ok && Array.isArray(cached.tracks)) {
          setManifest(cached);
          setStatus("ok");
          setErrorMsg(`Using cached manifest (live fetch failed: ${e?.message || "unknown error"})`);
        } else {
          setManifest(null);
          setStatus("fail");
          setErrorMsg(e?.message || "Manifest fetch failed");
        }
      });
  }, [backendBase, shareId]);

  const publishedAlbum = useMemo(() => {
    if (!manifest?.ok || !Array.isArray(manifest.tracks)) return null;

    return {
      id: manifest.shareId,
      albumName: "Published Album",
      artist: "Smart Bridge",
      // IMPORTANT: keep s3Key so the player page can refresh expired URLs
      tracks: manifest.tracks.map((t, i) => ({
        id: `pub-${i}`,
        title: String(t?.title || `Track ${i + 1}`),
        url: String(t?.url || ""),
        s3Key: String(t?.s3Key || ""),
      })),
    };
  }, [manifest]);

  return (
    <div>
      <h1>Shop</h1>

      <div style={{ fontFamily: "monospace", fontSize: 12, opacity: 0.85 }}>
        Backend: {backendBase || "—"} <br />
        ShareId: {shareId || "—"} <br />
        Publish: {status.toUpperCase()}
      </div>

      {errorMsg ? (
        <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 800 }}>
          {errorMsg}
        </div>
      ) : null}

      {/* If a shareId is present, NEVER show demo fallback. */}
      {shareId && !publishedAlbum ? (
        <div style={{ marginTop: 16 }}>
          {status === "loading" ? (
            <div>Loading published album…</div>
          ) : status === "missing-env" ? (
            <div>Missing backend env. Set VITE_ALBUM_BACKEND_URL in Blackout and redeploy.</div>
          ) : status === "fail" ? (
            <div>
              Could not load published album for shareId <b>{shareId}</b>.
            </div>
          ) : (
            <div>Waiting…</div>
          )}
        </div>
      ) : null}

      {/* Published album card */}
      {publishedAlbum ? (
        <div style={{ marginTop: 16 }}>
          <h3>{publishedAlbum.albumName}</h3>
          <div>{publishedAlbum.artist}</div>

          {/* Link directly to the real shareId route */}
          <div style={{ marginTop: 10 }}>
            <Link to={`/shop/product/${publishedAlbum.id}`}>
              Go to Product Page →
            </Link>
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => onPickTrack({ tracks: publishedAlbum.tracks, index: 0 })}
              disabled={!publishedAlbum.tracks?.length}
            >
              Play
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Tracks: {publishedAlbum.tracks.length}
          </div>
        </div>
      ) : null}

      {/* If no shareId at all, you can show whatever landing content you want */}
      {!shareId ? (
        <div style={{ marginTop: 16, opacity: 0.8 }}>
          Add a shareId in the URL to view a published album.
        </div>
      ) : null}
    </div>
  );
}
