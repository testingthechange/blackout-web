import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../data/catalog";

export default function Product({ activeTrackId, setActiveTrackId, onBuy }) {
  const { productId } = useParams();
  const product = useMemo(() => getProduct(productId), [productId]);

  if (!product) {
    return (
      <div style={{ color: "white", fontFamily: "system-ui" }}>
        <h1 style={{ marginTop: 0 }}>Product Not Found</h1>
        <Link to="/shop" style={{ color: "white" }}>Back to Shop</Link>
      </div>
    );
  }

  const tracks = product.tracks || [];
  const active = tracks.find((t) => t.id === activeTrackId) || tracks[0] || null;

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>Product</h1>
        <Link to="/shop" style={{ color: "white", opacity: 0.85 }}>← Back</Link>
      </div>

      {/* LEFT COLUMN WIDER THAN RIGHT */}
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
        {/* Left card = cover + metadata */}
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Meta / Cover</div>
          <img
            src={product.coverUrl}
            alt="cover"
            style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
          />
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8, lineHeight: 1.55 }}>
            <div>productId: <span style={{ opacity: 0.95 }}>{product.id}</span></div>
            <div>release: <span style={{ opacity: 0.95 }}>{product.releaseDate}</span></div>
            <div style={{ marginTop: 8, opacity: 0.75 }}>
              Phase 0 note: keep “meta ping” ready (future images/videos/docs).
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Top card = album info */}
          <div style={card}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{product.albumName}</div>
            <div style={{ opacity: 0.85, marginTop: 4 }}>{product.artist}</div>
            <div style={{ opacity: 0.75, marginTop: 6, fontSize: 12 }}>
              Release Date: {product.releaseDate}
            </div>
          </div>

          {/* Middle split into 3 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Buy</div>
              <button style={btn} onClick={() => onBuy(product.id)}>
                Buy (dummy)
              </button>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
                Goes to Sold → confirm → populates Account.
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Wire: Releases Data</div>
              <div style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.5 }}>
                Buy unlocks:
                <ul style={{ margin: "8px 0 0 18px" }}>
                  <li>Account / My Collection</li>
                  <li>Playlist formats (future)</li>
                  <li>NFT unlock + SmartBridge (future)</li>
                  <li>Swag / downloads (future)</li>
                </ul>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Distribution Hooks</div>
              <div style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.5 }}>
                Future safe-add modules:
                <ul style={{ margin: "8px 0 0 18px" }}>
                  <li>Collectors / metaverse link</li>
                  <li>External apps / APIs</li>
                  <li>Non-music pages isolated</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom card = tracks */}
          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Album Tracks</div>
            <div style={{ display: "grid", gap: 8 }}>
              {tracks.map((t) => {
                const isActive = active?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTrackId(t.id)}
                    style={{
                      ...trackBtn,
                      background: isActive ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                      borderColor: isActive ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.14)",
                      opacity: isActive ? 1 : 0.9,
                    }}
                  >
                    {t.title}
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Preview mode only (30s). Track click + bottom freeze player stay in sync.
            </div>
          </div>
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
};

const btn = {
  cursor: "pointer",
  color: "white",
  fontWeight: 950,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  fontFamily: "system-ui",
  width: "100%",
};

const trackBtn = {
  cursor: "pointer",
  textAlign: "left",
  color: "white",
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  fontFamily: "system-ui",
};
