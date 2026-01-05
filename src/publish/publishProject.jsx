// src/publish/publishProject.jsx
// Publish consumes AlbumBundle, generates shareId, writes artifacts to storage.
// Assumes you already have shareId creation + storage write utilities.

import { buildAlbumBundle } from "../data/selectors/buildAlbumBundle.jsx";

// These two helpers should already exist in your codebase.
// If not, implement them with your existing storage layer.
import { generateShareId } from "./shareId.jsx";
import { writeJson } from "./writePublishArtifact.jsx";

function invariant(cond, msg) {
  if (!cond) throw new Error(msg);
}

export async function publishProject({
  projectId,
  fetchJson,
  writeJsonImpl, // optional override for tests
}) {
  invariant(projectId, "publishProject: projectId required");
  invariant(typeof fetchJson === "function", "publishProject: fetchJson required");

  const albumBundle = await buildAlbumBundle({ projectId, fetchJson });

  const shareId = await generateShareId({ projectId, albumBundle });

  const outWriteJson = writeJsonImpl || writeJson;

  await outWriteJson(
    `/storage/published/${shareId}/album.bundle.json`,
    albumBundle
  );

  await outWriteJson(`/storage/published/${shareId}/manifest.json`, {
    schemaVersion: 1,
    shareId,
    projectId: String(projectId),
    createdAt: new Date().toISOString(),
    artifacts: {
      albumBundle: `/storage/published/${shareId}/album.bundle.json`,
    },
  });

  return { shareId };
}
