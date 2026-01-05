// src/publish/shareId.jsx
// If you already have shareId generation, keep yours.
// This is a safe deterministic-ish placeholder based on projectId + time.
// (Replace with your existing "publish works already shareId works" implementation.)

export async function generateShareId({ projectId }) {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${projectId}-${ts}-${rand}`;
}
