 // src/data/selectors/buildAlbumBundle.jsx
// Master Save (projectId) -> AlbumBundle (album-first)
// HARD RULES:
// - No demo/remote fallbacks
// - Only reads from project storage
// - Throws on missing required data or unsafe refs

const DEFAULT_MASTER_SAVE_PATH = (projectId) =>
  `/storage/projects/${projectId}/master_save.json`;

const isHttpUrl = (v) => typeof v === "string" && /^https?:\/\//i.test(v);
const isSafeProjectPath = (projectId, p) =>
  typeof p === "string" && p.startsWith(`/storage/projects/${projectId}/`);

function invariant(cond, msg) {
  if (!cond) throw new Error(msg);
}

// Try a few likely shapes without guessing new data.
// You should align these paths to your real Master Save schema if needed.
function extractAlbumSection(masterSave) {
  // Common candidates
  return (
    masterSave?.album ||
    masterSave?.sections?.album ||
    masterSave?.payload?.album ||
    masterSave?.masterSave?.album ||
    null
  );
}

function extractAlbumMeta(albumSection) {
  return (
    albumSection?.meta ||
    albumSection?.albumMeta ||
    albumSection?.pageMeta ||
    albumSection?.header ||
    {}
  );
}

function extractAlbumTracks(albumSection) {
  // Prefer explicit album-mode tracks from Album page section
  return (
    albumSection?.albumMode?.tracks ||
    albumSection?.albumModeTracks ||
    albumSection?.tracks ||
    albumSection?.tracklist ||
    []
  );
}

function normalizeTrack(projectId, t, idx) {
  // Support a few possible field names while keeping strict validation.
  const title = t?.title ?? t?.name ?? t?.trackTitle ?? `Track ${idx + 1}`;
  const audioPath =
    t?.audioPath ?? t?.audio ?? t?.audioFilePath ?? t?.filePath ?? t?.src ?? null;

  const artPath = t?.artPath ?? t?.art ?? t?.coverPath ?? null;

  invariant(audioPath, `AlbumBundle: missing audioPath for track[${idx}]`);
  invariant(
    !isHttpUrl(audioPath),
    `AlbumBundle: remote URL not allowed for track[${idx}] audioPath`
  );
  invariant(
    isSafeProjectPath(projectId, audioPath),
    `AlbumBundle: audioPath escapes project storage for track[${idx}]`
  );

  if (artPath) {
    invariant(
      !isHttpUrl(artPath),
      `AlbumBundle: remote URL not allowed for track[${idx}] artPath`
    );
    invariant(
      isSafeProjectPath(projectId, artPath),
      `AlbumBundle: artPath escapes project storage for track[${idx}]`
    );
  }

  return {
    index: idx,
    title,
    audioPath,
    artPath: artPath || null,
    // Keep any additional per-track meta without changing shape
    meta: t?.meta ?? {},
  };
}

export async function buildAlbumBundle({
  projectId,
  fetchJson,
  masterSavePath,
}) {
  invariant(projectId, "AlbumBundle: projectId is required");
  invariant(typeof fetchJson === "function", "AlbumBundle: fetchJson required");

  const msPath = masterSavePath || DEFAULT_MASTER_SAVE_PATH(projectId);
  invariant(
    isSafeProjectPath(projectId, msPath),
    "AlbumBundle: masterSavePath must be within project storage"
  );

  const masterSave = await fetchJson(msPath);
  invariant(masterSave, "AlbumBundle: Master Save not found or empty");

  const albumSection = extractAlbumSection(masterSave);
  invariant(albumSection, "AlbumBundle: album section not found in Master Save");

  const albumMeta = extractAlbumMeta(albumSection);
  const tracksRaw = extractAlbumTracks(albumSection);

  invariant(Array.isArray(tracksRaw), "AlbumBundle: tracks must be an array");
  invariant(tracksRaw.length > 0, "AlbumBundle: no tracks found in album section");

  const tracks = tracksRaw.map((t, i) => normalizeTrack(projectId, t, i));

  // Album-level art/cover
  const coverArtPath =
    albumMeta?.coverArtPath ?? albumMeta?.coverPath ?? albumSection?.coverArtPath ?? null;

  if (coverArtPath) {
    invariant(!isHttpUrl(coverArtPath), "AlbumBundle: remote URL not allowed for coverArtPath");
    invariant(
      isSafeProjectPath(projectId, coverArtPath),
      "AlbumBundle: coverArtPath escapes project storage"
    );
  }

  const bundle = {
    schemaVersion: 1,
    lineage: {
      projectId: String(projectId),
      source: "master_save",
      masterSavePath: msPath,
    },
    album: {
      title: albumMeta?.title ?? albumMeta?.albumTitle ?? "",
      artist: albumMeta?.artist ?? albumMeta?.albumArtist ?? "",
      coverArtPath: coverArtPath || null,
      meta: albumMeta || {},
      tracks,
    },
  };

  // Hard validation that no http URLs appear anywhere in file refs
  for (const tr of bundle.album.tracks) {
    invariant(!isHttpUrl(tr.audioPath), "AlbumBundle: http audioPath found after normalize");
    invariant(isSafeProjectPath(projectId, tr.audioPath), "AlbumBundle: unsafe audioPath post-check");
    if (tr.artPath) invariant(isSafeProjectPath(projectId, tr.artPath), "AlbumBundle: unsafe artPath");
  }

  return bundle;
}
