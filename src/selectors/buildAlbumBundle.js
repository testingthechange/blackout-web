export function buildAlbumBundle(manifest) {
  if (!manifest) return null;

  return {
    shareId: manifest.shareId,
    projectId: manifest.projectId,
    snapshotKey: manifest.snapshotKey,
    publishedAt: manifest.publishedAt,

    meta: {
      title: manifest.album?.title || "",
      artist: manifest.album?.artist || "",
      releaseDate: manifest.album?.releaseDate || "",
    },

    cover: {
      url: manifest.album?.coverUrl || "",
      key: manifest.album?.coverKey || "",
    },

    tracks: Array.isArray(manifest.tracks)
      ? manifest.tracks.map((t) => ({
          slot: Number(t.slot),
          title: t.title || `Track ${t.slot}`,
          audioUrl: t.audioUrl,
          audioKey: t.audioKey,
          durationSec: Number(t.durationSec || 0),
        }))
      : [],

    playback: {
      albumOrder: manifest.playback?.albumOrder || [],
      smartBridge: manifest.playback?.smartBridge || null,
    },

    diagnostics: manifest.diagnostics || {},
  };
}
