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
    setManifest(null);
    setErr("");

    if (!shareId) {
      setErr("Missing shareId. Use /product?shareId=YOUR_ID");
      return;
    }
    if (!manifestUrl) {
      setErr("Missing manifest URL");
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const r = await fetch(manifestUrl, { cache: "no-store" });
        if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
        const j = await r.json().catch(() => null);
        if (!j) throw new Error("Manifest JSON parse failed");
        if (String(j.shareId || "") !== String(shareId)) throw new Error("Manifest shareId mismatch");

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
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>
        Route: <b>{window.location.pathname}</b>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
        ShareId: <b>{shareId || "—"}</b>
      </div>

      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
        Manifest URL:{" "}
        {manifestUrl ? (
          <a href={manifestUrl} target="_blank" rel="noreferrer">
            {manifestUrl}
          </a>
        ) : (
          "—"
        )}
      </div>

      {loading ? <div style={{ marginTop: 14 }}>Loading manifest…</div> : null}
      {err ? <div style={{ marginTop: 14, color: "#b91c1c", fontWeight: 800 }}>{err}</div> : null}

      {manifest ? (
        <div style={{ marginTop: 18 }}>
          <h1 style={{ margin: 0 }}>{manifest?.album?.title || "Album"}</h1>

          {manifest?.album?.coverUrl ? (
            <img
              src={manifest.album.coverUrl}
              alt="cover"
              style={{ marginTop: 12, maxWidth: 320, width: "100%", borderRadius: 12 }}
            />
          ) : null}

          <div style={{ marginTop: 16, fontWeight: 800 }}>Tracks</div>
          <div style={{ marginTop: 8 }}>
            {(Array.isArray(manifest.tracks) ? manifest.tracks : []).map((t) => (
              <div key={t.slot} style={{ marginBottom: 6 }}>
                {t.slot}. {t.title}
              </div>
            ))}
          </div>

          <pre style={{ marginTop: 18, fontSize: 12, opacity: 0.85, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
