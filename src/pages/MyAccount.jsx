import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProduct } from "../data/catalog.js";

const PURCHASES_KEY = "blackout:purchases";
const MODE_KEY = "blackout:mode"; // "album" | "smartbridge"

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

  const setModeAndPersist = (next) => {
    setMode(next);
    localStorage.setItem(MODE_KEY, next);
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

      {/* Mode card (placeholder wired to localStorage) */}
      <div style={{ marginTop: 14, ...card }}>
        <div style={{ fontWeight: 900, fontSize: 14, opacity: 0.92, marginBottom: 10 }}>Mode</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label style={radioRow}>
            <input
              type="radio"
              name="mode"
              checked={mode === "album"}
              onChange={() => setModeAndPersist("album")}
            />
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

          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>
            (Player mode wiring comes next)
          </div>
        </div>
      </div>

      {/* My Collection */}
      <div style={{ marginTop: 14, ...card }}>
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>My Collection</div>

        {!albums.length ? (
          <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.5 }}>
            No albums yet. Go to <b>Shop</b>, hit Buy, confirm on Sold page — then you’ll see it here.
          </div>
        ) : (
          <div style={thumbGrid}>
            {albums.map((a) => (
              <button
                key={a.id}
                onClick={() => nav(`/shop/${encodeURIComponent(a.id)}`)}
                style={thumbBtn}
                title={`${a.albumName} — ${a.artist}`}
              >
                <img
                  src={a.coverUrl}
                  alt="cover"
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                />
                <div style={{ marginTop: 8, fontWeight: 900, fontSize: 12 }}>{a.albumName}</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>{a.artist}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  fontWeight: 900,
  opacity: 0.9,
};

const thumbGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 12,
};

const thumbBtn = {
  cursor: "pointer",
  textAlign: "left",
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
};
