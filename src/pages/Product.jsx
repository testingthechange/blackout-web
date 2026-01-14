// src/pages/Product.jsx
import React, { useEffect, useMemo, useState } from "react";

function getShareIdFromQuery() {
  const sp = new URLSearchParams(window.location.search);
  return String(sp.get("shareId") || "").trim();
}

export default function Product() {
  const shareId = useMemo(() => getShareIdFromQuery(), []);
  const manifestUrl = useMemo(() => {
    if (!shareId) return "";
    return `https://block-7306-player.s3.us-west-1.amazonaws.com/public/players/${encodeURIComponent(
      shareId
    )}/manifest.json`;
  }, [shareId]);

  const [manifest, setManifest] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("[PRODUCT] mount", { shareId, manifestUrl });

    if (!shareId) {
      setErr("Missing shareId (add ?shareId=...)");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErr("");
    setManifest(null);

    (async () => {
      try {
        const r = await fetch(manifestUrl, { cache: "no-store" });
        if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
        const j = await r.json();
        if (!cancelled) setManifest(j);
      } catch (e) {
        if (!cancelled) setErr(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId, manifestUrl]);

  return (
    <div style={{ padding: 16, border: "2px solid #111", borderRadius: 12 }}>
      <h1 style={{ margin: 0, marginBottom: 10 }}>Product</h1>

      <div style={{ fontSize: 14, marginBottom: 6 }}>
        ShareId: <b>{shareId || "—"}</b>
      </div>

      <div style={{ fontSize: 14, marginBottom: 12 }}>
        Manifest:{" "}
        {manifestUrl ? (
          <a href={manifestUrl} target="_blank" rel="noreferrer">
            {manifestUrl}
          </a>
        ) : (
          "—"
        )}
      </div>

      {loading ? <div style={{ fontWeight: 900 }}>Loading manifest…</div> : null}
      {err ? <div style={{ color: "#b91c1c", fontWeight: 900 }}>{err}</div> : null}

      {manifest ? (
        <pre style={{ marginTop: 12, padding: 12, background: "#f6f6f6", borderRadius: 10 }}>
          {JSON.stringify(manifest, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
