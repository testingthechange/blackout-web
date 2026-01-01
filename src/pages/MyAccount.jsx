// src/pages/MyAccount.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [mode, setMode] = useState(() => localStorage.getItem(MODE_KEY) || "album");

  const purchases = useMemo(() => loadPurchases(), []);
  const albums = useMemo(() => {
    const rows = purchases
      .map((p) => {
        const productId = String(p?.productId || "").trim();
        if (!productId) return null;
        const prod = getProduct(productId);
        if (!prod) return null;
        return { ...prod, purchasedAt: p?.purchasedAt || "" };
      })
      .filter(Boolean);

    const needle = q.trim().toLowerCase();
    if (!needle) return rows;

    return rows.filter((a) => {
      return (
        String(a.albumName || "").toLowerCase().includes(needle) ||
        String(a.artist || "").toLowerCase().includes(needle)
      );
    });
  }, [purchases, q]);

  const [activeProductId, setActiveProductId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_KEY);
    const first = albums[0]?.id;
    return saved || first || "album-001";
  });

  const activeAlbum = useMemo(() => getProduct(activeProductId) || albums[0] || null, [activeProductId, albums]);
  const tracks = activeAlbum?.tracks || [];

  const setModeAndPersist = (next) => {
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
  };

  const pickAlbum = (id) => {
    setActiveProductId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  };

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ marginTop: 0, marginBottom: 6 }}>Account</h1>
        <div style={{ fontSize: 12, opacity: 0.75 }}>My Collection</div>
      </div>

      {/* Search (same spot every time: top of content) */}
      <div style={{ marginTop: 10 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your collection…"
          style={searchInput}
        />
      </div>

      {/* Thumbnails row */}
      <div style={{ marginTop: 14, ...card }}>
        <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.92 }}>My Collection</div>

        {!albums.length ? (
          <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.5 }}>
            No albums yet. Go to <b>Shop</b>, hit Buy, confirm on Sold page — then you’ll see it here.
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
                  <div style={{ marginTop: 8, fontWeight: 950, fontSize: 12, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.albumName}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: 12, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.artist}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mode card under thumbnails (per your spec) */}
      <div style={{ marginTop: 14, ...card }}>
        <div style={{ fontWeight: 950, fontSize: 14, opacity: 0.92, marginBottom: 10 }}>Mode</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={radioRow}>
            <input type="radio" name="mode" checked={mode === "album"} onChange={() => setModeAndPersist("album")} />
            <span>Album</span>
          </label>

          <label style={radioRow}>
            <input type="radio" name="mode" checked={mode === "smartbridge"} onChange={() => setModeAndPersist("smartbridge")} />
            <span>Smart Bridge</span>
          </label>

          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
            (Mode → player wiring next)
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div style={{ marginTop: 14, ...pageCard }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          {/* Left: big art cover */}
          <div style={card}>
            <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.9 }}>Cover</div>
            {activeAlbum ? (
              <img
                src={activeAlbum.coverUrl}
                alt="cover"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
            ) : (
              <div style={{ opacity: 0.75 }}>No active album selected.</div>
            )}

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => activeAlbum && nav(`/shop/${encodeURIComponent(activeAlbum.id)}`)} style={ghostBtn} disabled={!activeAlbum}>
                View Product
              </button>
            </div>
          </div>

          {/* Right: thin column, 3 cards */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Album info like Shop */}
            <div style={card}>
              <div style={{ fontWeight: 1000, fontSize: 18 }}>{activeAlbum?.albumName || "—"}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>{activeAlbum?.artist || ""}</div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 12 }}>
                Release Date: {activeAlbum?.releaseDate || "—"}
              </div>
            </div>

            {/* Mini nav (top of card, not side) */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.92 }}>Navigation</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={pill}>My Collection</div>
                <div style={pillMuted}>Playlist</div>
                <div style={pillMuted}>Swag</div>
                <div style={pillMuted}>Other</div>
              </div>
            </div>

            {/* Tracks card */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 10, opacity: 0.92 }}>Album Tracks</div>

              {!tracks.length ? (
                <div style={{ opacity: 0.75, fontSize: 13 }}>No tracks yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {tracks.map((t, idx) => (
                    <button
                      key={t.id || idx}
                      style={trackRow}
                      onClick={() => {
                        // For now, go to the product page where track clicks already sync to the bottom player.
                        if (activeAlbum?.id) nav(`/shop/${encodeURIComponent(activeAlbum.id)}`);
                      }}
                      title="Track selection sync wiring continues on Product page"
                    >
                      <span style={{ fontWeight: 950 }}>{t.title}</span>
                      <span style={{ opacity: 0.7, fontSize: 12 }}>preview</span>
                    </button>
                  ))}
                </div>
              )}

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                Track click routes to Product (sync lives there right now).
              </div>
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

const searchInput = {
  width: "60%",
  minWidth: 320,
  maxWidth: 720,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
  fontSize: 15,
  fontWeight: 800,
};

const radioRow = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  fontWeight: 950,
  opacity: 0.9,
};

const thumbRow = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  paddingBottom: 6,
};

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

const pill = {
  fontSize: 12,
  fontWeight: 950,
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.10)",
  color: "white",
};

const pillMuted = {
  ...pill,
  opacity: 0.75,
  background: "rgba(255,255,255,0.05)",
};

const ghostBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 950,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
};

const trackRow = {
  cursor: "pointer",
  width: "100%",
  textAlign: "left",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  fontFamily: "system-ui",
};
