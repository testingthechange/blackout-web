// FILE: blackout-web/src/api/uploadAudioToS3.js
// Purpose: upload audio OR cover image to album-backend, returns s3Key.
// You MUST store returned s3Key into your project state BEFORE Master Save.

export async function uploadAudioToS3({ backendBase, projectId, file, s3KeyHint }) {
  const base = String(backendBase || "").replace(/\/+$/, "");
  if (!base) throw new Error("Missing backendBase");
  if (!projectId) throw new Error("Missing projectId");
  if (!file) throw new Error("Missing file");

  const fd = new FormData();
  fd.append("file", file);
  if (s3KeyHint) fd.append("s3Key", String(s3KeyHint));

  const url = `${base}/api/upload-to-s3?projectId=${encodeURIComponent(String(projectId))}`;

  const r = await fetch(url, { method: "POST", body: fd });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  if (!j?.ok || !j?.s3Key) throw new Error("Upload failed: missing s3Key");

  return String(j.s3Key);
}
