// src/publish/writePublishArtifact.jsx
// Minimal helper if you don't already have one.

async function ensureDir(dirPath) {
  const fs = await import("fs/promises");
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeJson(storagePath, obj) {
  // storagePath like "/storage/published/{shareId}/album.bundle.json"
  const fs = await import("fs/promises");
  const path = await import("path");

  const dir = path.dirname(storagePath);
  await ensureDir(dir);
  await fs.writeFile(storagePath, JSON.stringify(obj, null, 2), "utf8");
}
