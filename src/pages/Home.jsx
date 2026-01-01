// src/pages/Home.jsx
import React from "react";

/**
 * IMAGE SETUP (pick ONE):
 * 1) Put your image file in /public/home-hero.png  (recommended)
 *    Then HERO_SRC = "/home-hero.png"
 *
 * 2) Or put it in src/assets and import it:
 *    import hero from "../assets/home-hero.png";
 *    const HERO_SRC = hero;
 */
const HERO_SRC = "/home-hero.png";

export default function Home() {
  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={pageCard}>
        <h1 style={{ marginTop: 0, marginBottom: 12, fontWeight: 1000 }}>Home</h1>

        {/* Two-column layout */}
        <div style={grid}>
          {/* LEFT COLUMN */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* Card 1: Image + overlay */}
            <div style={card}>
              <div style={{ fontWeight: 1000, fontSize: 22, marginBottom: 12 }}>Music for the Fan</div>

              <div style={heroWrap}>
                <img src={HERO_SRC} alt="Music for the Fan" style={heroImg} />
                <div style={heroOverlay}>
                  <div style={heroOverlayText}>MUSIC</div>
                  <div style={heroOverlayText}>FOR THE</div>
                  <div style={heroOverlayText}>FAN</div>
                </div>
              </div>
            </div>

            {/* Card 2: Text (your exact copy) */}
            <div style={card}>
              <div style={{ fontWeight: 1000, fontSize: 18, marginBottom: 10 }}>How we compare to Streaming</div>

              <div style={p}>
                Streaming provides music for the music listener.
                <br />
                Block Radius provide music for the music fan.
              </div>

              <div style={{ height: 10 }} />

              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Smart Bridge the industry’s latest file format.</div>

              <div style={p}>
                Imagine listening to your favorite artists album, but every time you reset the shuffle, the album plays
                and sounds different. Smart Bridge creates artist authored transitions. Through these transitions, fans
                engage with the artist because they can experience the music and story telling the way they intended.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (blank for now) */}
          <div style={{ ...card, minHeight: 420, opacity: 0.65 }}>
            {/* intentionally blank */}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */

const pageCard = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: 16,
  background: "rgba(255,255,255,0.04)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1.25fr 1fr",
  gap: 16,
  alignItems: "start",
};

const card = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
};

const heroWrap = {
  position: "relative",
  width: "100%",
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
};

const heroImg = {
  width: "100%",
  height: 280,
  objectFit: "cover",
  display: "block",
  filter: "contrast(1.05) saturate(1.05)",
};

const heroOverlay = {
  position: "absolute",
  left: 14,
  top: 14,
  right: 14,
  bottom: 14,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  gap: 2,
  pointerEvents: "none",
  textShadow: "0 12px 35px rgba(0,0,0,0.85)",
};

const heroOverlayText = {
  fontWeight: 1000,
  letterSpacing: 0.6,
  fontSize: 28,
  lineHeight: 1.0,
};

const p = {
  margin: 0,
  opacity: 0.9,
  lineHeight: 1.6,
  fontSize: 14,
  fontWeight: 750,
};
