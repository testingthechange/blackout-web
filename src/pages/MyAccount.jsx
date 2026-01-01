import { useMemo, useState } from "react";
import { CATALOG } from "../data/catalog";

export default function MyAccount() {
  // Phase 1: pretend the user owns the first album
  const owned = useMemo(() => CATALOG.slice(0, 1), []);
  const selected = owned[0];

  const [mode, setMode] = useState("album"); // "album" | "smartbridge"

  const tracks = selected?.tracks || [];

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={pageCard}>
        <h1 style={{ marginTop: 0, marginBottom: 10 }}>My Account</h1>

        {/* My Collection row */}
        <div style={sectionTitle}>My Collection</div>
        <div style={thumbRow}>
          {owned.map((p) => (
            <div key={p.id} style={thumbCard} title={p.albumName}>
              <img
                src={p.coverUrl}
                alt={p.albumName}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
              />
            </div>
          ))}
        </div>

        <div style={{ height: 16 }} />

        {/* Mode card */}
        <div style={card}>
          <div style={{ fontWeight: 950, marginBottom: 10 }}>Mode</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <label style={radioWrap}>
              <input
                type="radio"
                name="mode"
                value="album"
                checked={mode === "album"}
                onChange={() => setMode("album")}
                style={radio}
              />
              <span style={{ fontWeight: 900 }}>Album</span>
            </label>

            <label style={radioWrap}>
              <input
                type="radio"
                name="mode"
                value="smartbridge"
                checked={mode === "smartbridge"}
                onChange={() => setMode("smartbridge")}
                style={radio}
              />
              <span style={{ fontWeight: 900 }}>SmartBridge</span>
            </label>

            <div style={{ fontSize: 12, opacity: 0.75, alignSelf: "center" }}>
              (Phase 1 placeholder — will wire into player later)
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
          {/* Left bigger cover */}
          <div style={card}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Album</div>
            <img
              src={selected.coverUrl}
              alt="cover"
              style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
            />
          </div>

          {/* Right: 3 stacked cards */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Album info */}
            <div style={card}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>{selected.albumName}</div>
              <div style={{ opacity: 0.85, marginTop: 4 }}>{selected.artist}</div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 12 }}>
                Release Date: {selected.releaseDate}
              </div>
            </div>

            {/* Mini nav (top of card, not side) */}
            <div style={card}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Sections</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div style={pill}>Collection</div>
                <div style={pill}>Playlist</div>
                <div style={pill}>Swag</div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                Placeholder only (keeps future pages from crashing the music side).
              </div>
            </div>

            {/* Tracks */}
            <div style={card}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Album Tracks</div>
              <div style={{ display: "grid", gap: 8 }}>
                {tracks.map((t) => (
                  <div key={t.id} style={trackRow}>
                    {t.title}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                (Phase 1: display only — player sync comes later)
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

const sectionTitle = {
  fontWeight: 950,
  opacity: 0.92,
  marginBottom: 10,
};

const thumbRow = {
  display: "flex",
  gap: 12,
  overflowX: "auto",
  paddingBottom: 6,
};

const thumbCard = {
  width: 96,
  height: 96,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  padding: 8,
  flexShrink: 0,
};

const pill = {
  padding: "10px 10px",
  textAlign: "center",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  fontWeight: 900,
};

const trackRow = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  fontWeight: 900,
};

const radioWrap = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
};

const radio = {
  accentColor: "white",
};
