import { useEffect, useMemo, useState } from "react";
import { CATALOG } from "../data/catalog";

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function getCachedPublishedAlbums() {
  // If you visited /shop?shareId=... we cache sb:manifest:<shareId>
  // Also store sb:lastShareId for convenience.
  const last = String(localStorage.getItem("sb:lastShareId") || "").trim();
  const ids = new Set();
  if (last) ids.add(last);

  // You can add more later; for now, just last is enough to show "2 albums" during local testing.
  const out = [];
  ids.forEach((sid) => {
    const k = `sb:manifest:${sid}`;
    const m = safeJsonParse(localStorage.getItem(k) || "");
    if (!m?.ok || !Array.isArray(m?.tracks)) return;

    out.push({
      id: `published-${m.shareId}`,
      albumName: "Published Album",
      artist: "Smart Bridge",
      coverUrl: (CATALOG?.[0]?.coverUrl) || "",
      releaseDate: m.publishedAt ? String(m.publishedAt).slice(0, 10) : "—",
      tracks: m.tracks.map((t, i) => ({
        id: `pub-${m.shareId}-${i}`,
        title: t.title || `Track ${i + 1}`,
        // account is FULL mode: we use url
        url: t.url,
        previewUrl: t.url,
      })),
      shareId: m.shareId,
      isPublished: true,
    });
  });

  return out;
}

export default function MyAccount({ q = "", backendBase = "", onPickTrack }) {
  const fallbackOwned = useMemo(() => {
    const p = CATALOG?.[0];
    if (!p) return [];
    // Treat fallback album as "owned" placeholder for now
    return [p];
  }, []);

  const [pubAlbums, setPubAlbums] = useState([]);

  useEffect(() => {
    setPubAlbums(getCachedPublishedAlbums());
  }, []);

  const albums = useMemo(() => {
    const all = [...pubAlbums, ...fallbackOwned];
    const needle = String(q || "").trim().toLowerCase();
    if (!needle) return all;

    return all.filter((a) => {
      const s = `${a?.albumName || ""} ${a?.artist || ""}`.toLowerCase();
      return s.includes(needle);
    });
  }, [pubAlbums, fallbackOwned, q]);

  const [activeAlbumId, setActiveAlbumId] = useState(albums[0]?.id || null);
  useEffect(() => {
    if (!albums.length) {
      setActiveAlbumId(null);
      return;
    }
    if (!albums.some((a) => a.id === activeAlbumId)) {
      setActiveAlbumId(albums[0].id);
    }
  }, [albums, activeAlbumId]);

  const activeAlbum = albums.find((a) => a.id === activeAlbumId) || albums[0] || null;
  const tracks = activeAlbum?.tracks || [];

  // Mini nav popup (account-only)
  const [modal, setModal] = useState(null); // "mycollection"|"playlist"|"swag"|"other"|null

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={pageCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h1 style={{ marginTop: 0, marginBottom: 0 }}>Account</h1>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Owned albums + full playback</div>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          {/* LEFT: Album thumbnails */}
          <div style={card}>
            <div style={{ fontWeight: 1000, marginBottom: 10 }}>My Albums</div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {albums.map((a) => {
                const active = a.id === activeAlbumId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveAlbumId(a.id)}
                    style={{
                      ...thumbBtn,
                      borderColor: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)",
                      background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <img
                      src={a.coverUrl}
                      alt="cover"
                      style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
                    />
                    <div style={{ marginTop: 10, fontWeight: 1000, textAlign: "left" }}>
                      {a.albumName}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 12, opacity: 0.8, textAlign: "left" }}>
                      {a.artist}
                    </div>
                    {a.isPublished ? (
                      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.75, textAlign: "left" }}>
                        Published • {a.shareId}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Mini nav + tracks */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Page-only mini nav card */}
            <div style={card}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>My Collection</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={tabBtn} onClick={() => setModal("mycollection")}>My Collection</button>
                <button style={tabBtn} onClick={() => setModal("playlist")}>Playlist</button>
                <button style={tabBtn} onClick={() => setModal("swag")}>Swag</button>
                <button style={tabBtn} onClick={() => setModal("other")}>Other</button>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Tabs open a quick popup (placeholder).
              </div>
            </div>

            {/* Active album info */}
            <div style={card}>
              <div style={{ fontWeight: 1000, fontSize: 18 }}>{activeAlbum?.albumName || "—"}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>{activeAlbum?.artist || ""}</div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 12 }}>
                Full mode playback (owned).
              </div>
            </div>

            {/* Tracks list (click plays — no preview labels, no routing) */}
            <div style={card}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>Album Tracks</div>
              <div style={{ display: "grid", gap: 8 }}>
                {tracks.map((t, i) => (
                  <button
                    key={t.id || i}
                    onClick={() => onPickTrack?.({ tracks, index: i })}
                    style={trackBtn}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Track click = play in bottom player (FULL).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup modal */}
      {modal ? (
        <div style={modalWrap} onMouseDown={() => setModal(null)}>
          <div style={modalCard} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 1000, fontSize: 16 }}>
              {modal === "mycollection" ? "My Collection" :
               modal === "playlist" ? "Playlist" :
               modal === "swag" ? "Swag" : "Other"}
            </div>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>
              Placeholder popup — next we wire real content.
            </div>
            <button style={{ ...tabBtn, marginTop: 14 }} onClick={() => setModal(null)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const pageCard = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.04)",
};

const card = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
};

const thumbBtn = {
  cursor: "pointer",
  textAlign: "left",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  padding: 12,
  color: "white",
  fontFamily: "system-ui",
};

const trackBtn = {
  cursor: "pointer",
  textAlign: "left",
  color: "white",
  fontWeight: 1000,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
};

const tabBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 1000,
  padding: "9px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
  fontSize: 12,
};

const modalWrap = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const modalCard = {
  width: "min(520px, 100%)",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(25,25,25,0.92)",
  color: "white",
  padding: 16,
  backdropFilter: "blur(10px)",
};
