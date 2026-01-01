import { Link } from "react-router-dom";
import { CATALOG } from "../data/catalog";

export default function Shop() {
  const p = CATALOG[0];

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={pageCard}>
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>Shop</h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Featured</div>
            <img
              src={p.coverUrl}
              alt="cover"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
            />
          </div>

          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>{p.albumName}</div>
            <div style={{ opacity: 0.85, marginBottom: 12 }}>{p.artist}</div>

            <Link to={`/shop/${p.id}`} style={linkBtn}>
              Go to Product Page →
            </Link>

            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
              Preview mode only. Buy is simulated.
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

const linkBtn = {
  display: "inline-block",
  textDecoration: "none",
  color: "white",
  fontWeight: 900,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
};
