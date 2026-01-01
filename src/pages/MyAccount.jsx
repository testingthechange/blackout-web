// src/pages/MyAccount.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getProduct } from "../data/catalog.js";

const PURCHASES_KEY = "blackout:purchases";
const MODE_KEY = "blackout:mode"; // "album" | "smartbridge"
const ACTIVE_KEY = "blackout:activeProductId";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadPurchases() {
  const raw = localStorage.getItem(PURCHASES_KEY);
  const parsed = raw ? safeParse(raw) : null;
  return Array.isArray(parsed) ? parsed : [];
}

export default function MyAccount() {
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || "album");

  const purchases = useMemo(() => loadPurchases(), []);
  const albums = useMemo(() => {
    return purchases
      .map((p) => {
        const productId = String(p?.productId || "").trim();
        if (!productId) return null;
        const prod = getProduct(productId);
        if (!prod) return null;
        return { ...prod, purchasedAt: p?.purchasedAt || "" };
      })
      .filter(Boolean);
  }, [purchases]);

  const [activeProductId, setActiveProductId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    const first = albums[0]?.id;
    return saved || first || "album-001";
  });

  const activeAlbum = useMemo(
    () => getProduct(activeProductId) || albums[0] || null,
    [activeProductId, albums]
  );

  const tracks = activeAlbum?.tracks || [];

  const setModeAndPersist = (next) => {
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
  };

  const pickAlbum = (id) => {
    setActiveProductId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  };

  const playTrackNow = (trackId) => {
    if (!activeAlbum?.id || !trackId) return;
    window.dispatchEvent(
      new CustomEvent("blackout:play", { detail: { productId: activeAlbum.id, trackId } })
    );
  };

  // ---------- Mini Nav (Account page only) ----------
  const [openTab, setOpenTab] = useState(null); // "collection" | "playlist" | "swag" | "other" | null
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0, width: 240 });
  const miniNavCardRef = useRef(null);
  const tabRefs = useRef({}); // { key: HTMLButtonElement }

  const toggleTab = (key) => {
    if (openTab === key) {
      setOpenTab(null);
      return;
    }

    // position dropdown under clicked tab
    const card = miniNavCardRef.current;
    const btn = tabRefs.current[key];
    if (card && btn) {
      const cardRect = card.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();

      const left = Math.max(12, Math.min(btnRect.left - cardRect.left, cardRect.width - 260));
      const top = btnRect.bottom - cardRect.top + 10;

      setMenuPos({
        left,
        top,
        width: 260,
      });
    }
    setOpenTab(key);
  };

  // close on outside click / esc
  useEffect(() => {
    if (!openTab) return;

    const onDown = (e) => {
      const card = miniNavCardRef.current;
      if (!card) return;
      if (!card.contains(e.target)) setOpenTab(null);
    };

    const onKey = (e) => {
      if (e.key === "Escape") setOpenTab(null);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openTab]);

  const tabLabel = (k) =>
    k === "collection" ? "My Collection" : k === "playlist" ? "Playlist" : k === "swag" ? "Swag" : "Other";

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Account</h1>

      {/* Thumbnails */}
      <div style={{ marginTop: 10, ...card }}>
        <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.92 }}>My Collection</div>

        {!albums.length ? (
          <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.5 }}>
            No albums yet. Buy one in Shop, confirm on Sold page — it will appear here.
          </div>
        ) : (
          <div style={thumbRow}>
            {albums.map((a) => {
              const isActive = a.id === activeProductId;
              return (
                <button
                  key={a.id}
                  onClick={() => pickAlbum(a.id)}
                  style={{
                    ...thumbBtn,
                    borderColor: isActive ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
                    background: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    opacity: isActive ? 1 : 0.9,
                  }}
                  title={`${a.albumName} — ${a.artist}`}
                >
                  <img
                    src={a.coverUrl}
                    alt="cover"
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: 12,
                      objectFit: "cover",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  />
                  <div style={thumbTitle}>{a.albumName}</div>
                  <div style={thumbSub}>{a.artist}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mode */}
      <div style={{ marginTop: 14, ...card }}>
        <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.92, marginBottom: 10 }}>Mode</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={radioRow}>
            <input type="radio" name="mode" checked={mode === "album"} onChange={() => setModeAndPersist("album")} />
            <span>Album</span>
          </label>

          <label style={radioRow}>
            <input
              type="radio"
              name="mode"
              checked={mode === "smartbridge"}
              onChange={() => setModeAndPersist("smartbridge")}
            />
            <span>Smart Bridge</span>
          </label>

          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>(wiring next)</div>
        </div>
      </div>

      {/* Two-column */}
      <div style={{ marginTop: 14, ...pageCard }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          {/* Left cover */}
          <div style={card}>
            <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.9 }}>Cover</div>
            {activeAlbum ? (
              <img
                src={activeAlbum.coverUrl}
                alt="cover"
                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
              />
            ) : (
              <div style={{ opacity: 0.75 }}>No active album selected.</div>
            )}
          </div>

          {/* Right cards */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Album info */}
            <div style={card}>
              <div style={{ fontWeight: 1000, fontSize: 18 }}>{activeAlbum?.albumName || "—"}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>{activeAlbum?.artist || ""}</div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 12 }}>
                Release Date: {activeAlbum?.releaseDate || "—"}
              </div>
            </div>

            {/* ✅ Mini Nav Card (page-only) */}
            <div ref={miniNavCardRef} style={{ ...card, position: "relative" }}>
              <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.92 }}>Mini Nav</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["collection", "playlist", "swag", "other"].map((k) => {
                  const active = openTab === k;
                  return (
                    <button
                      key={k}
                      ref={(el) => (tabRefs.current[k] = el)}
                      onClick={() => toggleTab(k)}
                      style={{
                        ...pillBtn,
                        background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                        opacity: active ? 1 : 0.9,
                      }}
                    >
                      {tabLabel(k)}
                    </button>
                  );
                })}
              </div>

              {openTab ? (
                <div
                  style={{
                    position: "absolute",
                    left: menuPos.left,
                    top: menuPos.top,
                    width: menuPos.width,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(10,12,16,0.96)",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
                    padding: 10,
                    zIndex: 50,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontWeight: 1000, marginBottom: 8 }}>{tabLabel(openTab)}</div>

                  <div style={{ display: "grid", gap: 8 }}>
                    <button style={menuItem} onClick={() => window.alert(`${tabLabel(openTab)}: coming soon`)}>
                      Open
                    </button>
                    <button style={menuItem} onClick={() => window.alert("Placeholder action")}>
                      Manage
                    </button>
                    <button style={menuItem} onClick={() => setOpenTab(null)}>
                      Close
                    </button>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                    Click outside or press Esc to close.
                  </div>
                </div>
              ) : null}
            </div>

            {/* Tracks */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.92 }}>Album Tracks</div>

              {!tracks.length ? (
                <div style={{ opacity: 0.75, fontSize: 13 }}>No tracks yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {tracks.map((t, idx) => (
                    <button key={t.id || idx} style={trackRow} onClick={() => playTrackNow(t.id)} title="Play">
                      <span style={{ fontWeight: 950 }}>{t.title}</span>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>Click a track to play (full).</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const pageCard = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.04)",
};

const card = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
};

const radioRow = { display: "flex", gap: 8, alignItems: "center", fontWeight: 950, opacity: 0.9 };

const thumbRow = { display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 };

const thumbBtn = {
  cursor: "pointer",
  textAlign: "left",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  flex: "0 0 auto",
};

const thumbTitle = {
  marginTop: 8,
  fontWeight: 950,
  fontSize: 12,
  maxWidth: 110,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const thumbSub = {
  opacity: 0.7,
  fontSize: 12,
  maxWidth: 110,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const trackRow = {
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontFamily: "system-ui",
};

const pillBtn = {
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 950,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const menuItem = {
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  padding: "10px 10px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
};
