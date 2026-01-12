// src/publish/getActiveShareId.js
const KEY = "blackout.activeShareId";

export function getActiveShareId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("shareId");
  if (fromQuery && fromQuery.trim()) {
    localStorage.setItem(KEY, fromQuery.trim());
    return fromQuery.trim();
  }

  const fromStorage = localStorage.getItem(KEY);
  if (fromStorage && fromStorage.trim()) return fromStorage.trim();

  return null;
}

export function setActiveShareId(shareId) {
  if (shareId && shareId.trim()) localStorage.setItem(KEY, shareId.trim());
}

export function clearActiveShareId() {
  localStorage.removeItem(KEY);
}
