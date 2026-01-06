import { Link } from "react-router-dom";

export default function Shop({ backendBase, shareId, onPickTrack }) {
  // Hard-coded featured product (your published album)
  const featured = {
    shareId: "ebc44e3cdc40ce41",
    title: "Block Radius",
    coverUrl: null, // will fall back to placeholder
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 14 }}>Shop</div>

      {/* FEATURED PRODUCT THUMBNAIL */}
      <Link
        to={`/shop/product/${featured.shareId}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <div
          style={{
            width: 240,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.04)",
            overflow: "hidden",
            cursor: "pointer",
          }}
        >
          {/* Cover */}
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              background: featured.coverUrl
                ? `url(${featured.coverUrl}) center / cover no-repeat`
                : "linear-gradient(135deg, #1f2937, #020617)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              opacity: 0.9,
            }}
          >
            {!featured.coverUrl ? "Album Cover" : null}
          </div>

          {/* Meta */}
          <div style={{ padding: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 15 }}>
              {featured.title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              View Album
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
