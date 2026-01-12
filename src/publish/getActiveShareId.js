// src/publish/getActiveShareId.js
const KEY = "blackout.activeShareId";

function readFromUrl() {
  try {
    const url = new URL(window.location.href);
    const v = url.searchParams.get("shareId");
    return (v || "").trim();
  } catch {
    return "";
  }
}

function readFromStorage() {
  try {
    return (localStorage.getItem(KEY) || "").trim();
  } catch {
    return "";
  }
}

function writeToStorage(v) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // ignore
  }
}

export function getActiveShareId() {
  const fromUrl = readFromUrl();
  if (fromUrl) {
    writeToStorage(fromUrl);
    return fromUrl;
  }
  return readFromStorage();
}

export function setActiveShareId(shareId) {
  const v = String(shareId || "").trim();
  if (v) writeToStorage(v);
}
