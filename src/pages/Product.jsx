// src/pages/Product.jsx
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../data/catalog.js";

export default function Product({ q = "", onPickTrack, onBuy }) {
  const { productId } = useParams();
  const nav = useNavigate();

  const product = useMemo(() => getProduct(productId), [productId]);

  if (!product) {
    return (
      <div style={{ color: "white", fontFamily: "system-ui" }}>
        <div style={pageCard}>
          <h1 style={{ marginTop: 0 }}>Product Not Found</h1>
          <div style={{ opacity: 0.75, marginTop: 6 }}>productId: {String(productId || "")}</div>
        </div>
      </div>
    );
  }

  const tracks = Array.isArray(product.tracks) ? product.tracks : [];

  // simple filter using global search query
  const filteredTracks = useMemo(() => {
    const qq = String(q || "").trim().toLowerCase();
    if (!qq) return tracks;
    return tracks.filter((t) => String(t?.title || "").toLowerCase().includes(qq));
  }, [tracks, q]);

  const safeBuy = () => {
    // ✅ FIX: never crash if onBuy is missing
    if (typeof onBuy === "function") {
      onBuy(product.id);
      return;
    }
    // default fallback: go to Sold
    nav(`/sold?productId=${encodeURIComponent(product.id)}`);
  };

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={pageCard}>
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>Product</h1>

        {/* LEFT COLUMN WIDER */}
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          {/* Left */}
          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Album</div>
            <img
              src={product.coverUrl}
              alt="cover"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
            />

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.82, lineHeight: 1.55 }}>
              <div style={{ opacity: 0.9, fontWeight: 900 }}>Meta</div>
              <div>
                productId: <span style={{ opacity: 0.95 }}>{product.id}</span>
              </div>
              <div>
                release: <span style={{ opacity: 0.95 }}>{product.releaseDate}</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Info */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{product.albumName}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>{product.artist}</div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 12 }}>Release Date: {product.releaseDate}</div>
            </div>

            {/* Buy */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 12 }}>Buy</div>

              <button style={buyBtn} onClick={safeBuy} aria-label="Buy album">
                BUY $17
              </button>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Purchase is simulated on the next screen.
              </div>
            </div>

            {/* Album details */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 10 }}>Album</div>
              <ul style={bullets}>
                <li>8 song album</li>
                <li>Artist authored transitions</li>
                <li>Two play modes</li>
                <li>Smart Bridge</li>
                <li>FREE NFT MP3 album mix</li>
                <li>and more</li>
              </ul>
            </div>

            {/* Tracks */}
            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Album Tracks</div>

              <div style={{ display: "grid", gap: 8 }}>
                {filteredTracks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      // ✅ this is what triggers the bottom player in Shop preview mode
                      if (typeof onPickTrack === "function") onPickTrack(t);
                    }}
                    style={trackBtn}
                  >
                    {t.title}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Track click plays in the bottom player (preview mode).
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

const buyBtn = {
  cursor: "pointer",
  width: "100%",
  height: 56,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.35)",
  background: "linear-gradient(180deg, rgba(45,215,120,1) 0%, rgba(20,160,85,1) 100%)",
  color: "white",
  fontFamily: "system-ui",
  fontWeight: 1000,
  fontSize: 18,
  letterSpacing: 0.6,
  boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
};

const trackBtn = {
  cursor: "pointer",
  textAlign: "left",
  color: "white",
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
};

const bullets = {
  margin: 0,
  paddingLeft: 18,
  lineHeight: 1.6,
  opacity: 0.9,
  fontWeight: 800,
};
