// src/data/published/loadAlbumBundleByShareId.js

export async function loadAlbumBundleByShareId(shareId) {
  if (!shareId) {
    throw new Error("loadAlbumBundleByShareId: missing shareId");
  }

  const manifestUrl = `https://block-7306-player.s3.us-west-1.amazonaws.com/public/players/${encodeURIComponent(
    shareId
  )}/manifest.json`;

  const res = await fetch(manifestUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Manifest fetch failed (${res.status})`);
  }

  const manifest = await res.json();
  if (!manifest || manifest.shareId !== shareId) {
    throw new Error("Invalid or mismatched manifest");
  }

  return manifest;
}
