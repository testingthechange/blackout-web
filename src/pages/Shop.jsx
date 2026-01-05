// src/pages/Shop.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Shop({ backendBase, shareId }) {
  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      setManifest(null);
      return;
    }
    if (!shareId) {
      setStatus("no-shareid");
      setManifest(null);
      return;
    }

    setStatus("loading");
    fetch(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.tracks)) throw new Error("bad manifest");
        setManifest(j);
        setStatus("ok");
      })
      .catch(() => {
        setManifest(null);
        setStatus("fail");
      });
  }, [backendBase, shareId]);

  const trackTitles = useMemo(() => {
    if (!manifest?.ok) return [];
    return (manifest.tracks || []).map((t, i) => ({
      i,
      title: String(t?.title || `Track ${i + 1}`),
      s3Key: String(t?.s3Key || ""),
    }));
  }, [manifest]);

  return (
    <div>
      <h1 style={{ margin: 0 }}>Shop</h1>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
        Publish: {status.toUpperCase()}
        {shareId ? (
          <>
            {" "}
            · ShareId: <span style={{ fontFamily: "monospace", fontWeight: 900 }}>{shareId}</span>
          </>
        ) : null}
      </div>

      {!shareId ? (
        <div style={{ marginTop: 14, opacity: 0.85 }}>
          Add <code>?shareId=YOUR_SHARE_ID</code> to the URL.
        </div>
      ) : null}

      {status === "ok" ? (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid rgba(255,255,255,0.16)", borderRadius: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Published Album</div>

          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
            Tracks: <strong>{trackTitles.length}</strong>
          </div>

          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {trackTitles.map((t) => (
              <li key={t.i} style={{ marginBottom: 6, opacity: 0.95 }}>
                {t.title}
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 12 }}>
            <Link
              to={`/shop/product/${encodeURIComponent(shareId)}?shareId=${encodeURIComponent(shareId)}`}
              style={{
                display: "inline-block",
                textDecoration: "none",
                fontWeight: 900,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              Open Product →
            </Link>
          </div>
        </div>
      ) : null}

      {status === "fail" ? (
        <div style={{ marginTop: 16, opacity: 0.9 }}>
          Failed to load publish manifest. Check backend + shareId.
        </div>
      ) : null}
    </div>
  );
}
