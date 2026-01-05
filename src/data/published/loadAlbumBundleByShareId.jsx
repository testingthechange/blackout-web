// src/data/published/loadAlbumBundleByShareId.jsx
// shareId -> AlbumBundle (published artifact only)

function invariant(cond, msg) {
  if (!cond) throw new Error(msg);
}

export async function loadAlbumBundleByShareId({ shareId, fetchJson }) {
  invariant(shareId, "loadAlbumBundleByShareId: shareId required");
  invariant(typeof fetchJson === "function", "loadAlbumBundleByShareId: fetchJson required");

  const path = `/storage/published/${shareId}/album.bundle.json`;
  const bundle = await fetchJson(path);

  invariant(bundle, "Published bundle not found");
  invariant(bundle?.schemaVersion === 1, "Unsupported bundle schemaVersion");
  invariant(bundle?.album?.tracks?.length > 0, "Bundle has no tracks");

  return bundle;
}
