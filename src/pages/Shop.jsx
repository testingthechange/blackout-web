import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CATALOG } from "../data/catalog";

function useQuery() {
  const loc = useLocation();
  return useMemo(() => new URLSearchParams(loc.search), [loc.search]);
}

export default function Shop() {
  const fallback = CATALOG[0];

  const q = useQuery();
  const shareId = String(q.get("shareId") || "").trim();

  const [status, setStatus] = useState("idle"); // idle | checking | ok | fail | missing
  const [album, setAlbum] = useState(null);

  useEffect(() => {
    const base = String(import.meta.env.VITE_ALBUM_BACKEND_URL || "").replace(/\/+$/, "");

    if (!shareId) {
      setStatus("idle");
      setAlbum(null);
      return;
    }
    if (!base) {
      setStatus("missing");
      return;
    }

    let cancelled = false;
    setStatus("checking");

    fetch(`${base}/api/publish/${encodeURIComponent(shareId)}/manifest`)
      .then(async (res) => {
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok) throw new Error(j?.error || `HTTP ${res.status}`);
        const a = j?.manifest?.album;
        if (!a || typeof a !== "object") throw new Error("BAD_MANIFEST");
        if (!cancelled) {
          setAlbum(a);
          setStatus("ok");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fail");
      });

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const p = album || fallback;

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <div style={pageCard}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h1 style={{ marginTop: 0, marginBottom: 10 }}>Shop</h1>

          <div style={pill}>
            Publish:{" "}
            {!shareId && "NO SHAREID"}
            {shareId && status === "checking" && "…"}
            {shareId && status === "ok" && "OK"}
            {shareId && status === "fail" && "FAIL"}
            {shareId && status === "missing" && "MISSING ENV"}
          </div>
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
          Test publish by adding <strong>?shareId=TEST123</strong> to the URL.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Featured</div>

            <Link to={`/shop/${p.id}`} style={{ display: "block" }}>
              <img
                src={p.coverUrl}
                alt="cover"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              />
            </Link>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
              {p.albumName}
            </div>
            <div style={{ opacity: 0.85, marginBottom: 12 }}>
              {p.artist}
            </div>

            <Link to={`/shop/${p.id}`} style={linkBtn}>
              Go to Product Page →
            </Link>

            <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
              Using {album ? "PUBLISHED MANIFEST" : "FALLBACK"} data.
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

const pill = {
  fontFamily: "system-ui",
  fontSize: 12,
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  opacity: 0.95,
};
