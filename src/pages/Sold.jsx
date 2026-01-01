import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getProduct } from "../data/catalog";

const LS_KEY = "blackout_purchases_v1";

function loadPurchases() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function savePurchases(items) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export default function Sold() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const productId = sp.get("productId") || "";
  const product = useMemo(() => getProduct(productId), [productId]);

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Sold (Dummy)</h1>

      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          {product ? product.albumName : "Unknown Product"}
        </div>
        <div style={{ opacity: 0.85, marginBottom: 12 }}>
          Click confirm to add to Account / My Collection (localStorage for now).
        </div>

        <button
          style={btn}
          onClick={() => {
            if (!product) return;
            const existing = loadPurchases();
            const next = Array.from(new Set([product.id, ...existing]));
            savePurchases(next);
            nav("/account");
          }}
        >
          Confirm → Add to My Collection
        </button>

        <div style={{ marginTop: 12 }}>
          <Link to="/shop" style={{ color: "white", opacity: 0.85 }}>Back to Shop</Link>
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
  maxWidth: 640,
};

const btn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
  width: "100%",
};
