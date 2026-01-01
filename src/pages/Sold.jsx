import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProduct } from "../data/catalog.js";

const PURCHASES_KEY = "blackout:purchases";

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

function savePurchases(rows) {
  localStorage.setItem(PURCHASES_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}

function useQuery() {
  const loc = useLocation();
  return useMemo(() => new URLSearchParams(loc.search), [loc.search]);
}

export default function Sold() {
  const nav = useNavigate();
  const q = useQuery();

  const productId = String(q.get("productId") || "").trim() || "album-001";
  const product = getProduct(productId);

  const [done, setDone] = useState(false);

  const confirm = () => {
    const rows = loadPurchases();
    const exists = rows.some((r) => String(r?.productId) === String(productId));
    const next = exists
      ? rows
      : [{ productId, purchasedAt: new Date().toISOString() }, ...rows];

    savePurchases(next);
    setDone(true);

    // route to Account
    nav("/account");
  };

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Sold</h1>

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>Confirm Purchase</div>

        <div style={{ opacity: 0.85, marginBottom: 12 }}>
          {product ? (
            <>
              <div style={{ fontWeight: 900 }}>{product.albumName}</div>
              <div style={{ opacity: 0.75 }}>{product.artist}</div>
            </>
          ) : (
            <div style={{ opacity: 0.75 }}>Unknown product: {productId}</div>
          )}
        </div>

        <button onClick={confirm} style={primaryBtn} disabled={done}>
          {done ? "Added to Account ✓" : "Confirm Purchase"}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
          This is a dummy purchase step. It adds the album to <b>Account → My Collection</b>.
        </div>
      </div>
    </div>
  );
}

const card = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
  maxWidth: 720,
};

const primaryBtn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 900,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(34,197,94,0.28)", // subtle green
};
