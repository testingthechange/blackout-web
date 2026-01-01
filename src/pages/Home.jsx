// src/pages/Home.jsx
export default function Home() {
  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Home</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
            <img src="/home-fan.webp" alt="fan" style={{ width: "100%", height: 340, objectFit: "cover", display: "block" }} />
            <div style={overlay}>
              <div style={txt}>MUSIC for the FAN</div>
            </div>
          </div>
        </div>

        <div style={card} />
      </div>
    </div>
  );
}

const card = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
};

const overlay = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 90%)",
  display: "flex",
  alignItems: "flex-end",
  padding: 18,
};

const txt = { fontWeight: 1000, fontSize: 34, textShadow: "0 10px 25px rgba(0,0,0,0.55)" };
