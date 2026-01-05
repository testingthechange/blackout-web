import { useEffect, useState } from "react";

function invariant(cond, msg) {
  if (!cond) throw new Error(msg);
}

export default function Product({ backendBase, onPlayAlbum }) {
  const shareId = window.location.pathname.split("/").pop();

  const [album, setAlbum] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!backendBase || !shareId) return;

    fetch(`${backendBase}/api/publish/${shareId}/manifest`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        invariant(j?.ok, "Invalid manifest");
        invariant(Array.isArray(j.tracks), "No tracks");

        const tracks = j.tracks.map((t) => ({
          title: t.title,
          url: t.url,
        }));

        const albumData = {
          title: "Published Album",
          artist: "Artist",
          tracks,
        };

        setAlbum(albumData);

        // 🔥 THIS KILLS HELIX
        onPlayAlbum({ tracks, index: 0 });
      })
      .catch((e) => setErr(String(e.message || e)));
  }, [backendBase, shareId, onPlayAlbum]);

  if (err) return <div style={{ color: "red" }}>{err}</div>;
  if (!album) return <div>Loading…</div>;

  return (
    <div>
      <h2>{album.title}</h2>
      <div>{album.artist}</div>

      <ol>
        {album.tracks.map((t, i) => (
          <li key={i}>{t.title}</li>
        ))}
      </ol>
    </div>
  );
}
