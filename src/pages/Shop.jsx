import { Link } from "react-router-dom";

export default function Shop({ backendBase, shareId }) {
  const hasBackend = !!backendBase;
  const hasShare = !!shareId;

  return (
    <div>
      <h1>Shop</h1>

      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 12 }}>
        Backend: {hasBackend ? "OK" : "MISSING ENV"} · ShareId: {hasShare ? shareId : "—"}
      </div>

      {!hasBackend ? (
        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12 }}>
          Missing <code>VITE_ALBUM_BACKEND_URL</code>.
        </div>
      ) : null}

      {!hasShare ? (
        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12 }}>
          Publish: NO SHAREID<br />
          Add <code>?shareId=YOUR_SHARE_ID</code> to the URL, then this page will show the Product link.
        </div>
      ) : (
        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Published Album</div>
          <div style={{ opacity: 0.85, marginBottom: 10 }}>ShareId: <code>{shareId}</code></div>

          <Link to={`/shop/product/${encodeURIComponent(shareId)}`} style={{ color: "white", fontWeight: 900 }}>
            Open Product →
          </Link>
        </div>
      )}
    </div>
  );
}
