// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";
import { getActiveShareId } from "../publish/getActiveShareId";

export default function Product({ backendBase: backendBaseProp, shareId: shareIdProp }) {
  const backendBase = backendBaseProp || import.meta.env.VITE_ALBUM_BACKEND_URL;
  const shareId = useMemo(() => shareIdProp || getActiveShareId(), [shareIdProp]);

  const [status, setStatus] = useState("idle"); // idle | missing-env | missing-shareid | loading | ok | fail
  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!shareId) {
      setStatus("missing-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");
    setErr(null);

    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        return j;
      })
      .then((j) => {
        if (!j?.ok) throw new Error("manifest not ok");
        setManifest(j);
        setStatus("ok");
      })
      .catch((e) => {
        setManifest(null);
        setErr(e);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  if (status === "missing-env") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Product</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>Missing backend env (VITE_ALBUM_BACKEND_URL).</div>
      </div>
    );
  }

  if (status === "missing-shareid") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Product</div>
        <div style={{ marginTop: 8, opacity: 0.85 }}>
          Missing shareId. Add <code>?shareId=...</code>.
        </div>
      </div>
    );
  }

  if (status === "fail") {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 900 }}>Product</div>
        <div style={{ marginTop: 10, padding: 12, border: "1px solid rgba(255,0,0,0.45)", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Failed to load product</div>
          <div style={{ opacity: 0.9, whiteSpace: "pre-wrap" }}>{String(err?.message || err)}</div>
        </div>
      </div>
    );
  }

  if (!manifest) return <div style={{ padding: 16 }}>Loading…</div>;

  const albumName = String(manifest?.albumName || "Album");
  const performers = String(manifest?.performers || "");
  const description = String(manifest?.productDescription || "Digital album access tied to published snapshot.");
  const priceText = String(manifest?.priceText || "$9.99");

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>Product</div>
      <div style={{ opacity: 0.85, marginBottom: 14 }}>
        {albumName}{performers ? ` — ${performers}` : ""}
      </div>

      <div
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 16,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
          maxWidth: 760,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ fontWeight: 900 }}>{albumName}</div>
          <div style={{ fontWeight: 900 }}>{priceText}</div>
        </div>

        <div style={{ marginTop: 10, opacity: 0.85, lineHeight: 1.35 }}>{description}</div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={`/shop?shareId=${encodeURIComponent(shareId)}`} style={btn}>
            Back to shop
          </a>
          <a href={`/account?shareId=${encodeURIComponent(shareId)}`} style={btn}>
            View account
          </a>
        </div>

        <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
          Snapshot source: <code>/api/publish/{shareId}/manifest</code>
        </div>
      </div>
    </div>
  );
}

const btn = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
};
