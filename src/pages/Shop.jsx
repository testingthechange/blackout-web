import { Link } from "react-router-dom";

export default function Shop() {
  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0, fontSize: 44, letterSpacing: -0.6 }}>Shop</h1>
      <p style={{ opacity: 0.85, maxWidth: 720, lineHeight: 1.5 }}>
        Shell first. Next step: pull data from S3 catalog index and render real releases.
      </p>

      <div
        style={{
          marginTop: 22,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            borderRadius: 14,
            padding: 18,
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 18 }}>Test Release</div>
          <div style={{ opacity: 0.75, marginTop: 6 }}>shareId: 2b5b538e60429a31</div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              to="/play?shareId=2b5b538e60429a31"
              style={{
                textDecoration: "none",
                color: "white",
                fontWeight: 800,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.10)",
              }}
            >
              Preview
            </Link>

            <button
              onClick={() => alert("Next: checkout/unlock flow (stub)")}
              style={{
                cursor: "pointer",
                color: "white",
                fontWeight: 800,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
                opacity: 0.95,
              }}
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
