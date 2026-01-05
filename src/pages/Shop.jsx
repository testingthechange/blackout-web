import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function ErrorPanel({ title, details }) {
  return (
    <div style={{ padding: 16, border: "1px solid #f00", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{title}</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{details}</pre>
    </div>
  );
}

async function fetchJson(url) {
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j;
}

export default function Shop({ backendBase, shareId }) {
  const [status, setStatus] = useState("idle");
  const [manifest, setManifest] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");

  useEffect(() => {
    if (!backendBase) {
      setStatus("missing-env");
      return;
    }
    if (!shareId) {
      setStatus("no-shareid");
      setManifest(null);
      setCoverUrl("");
      return;
    }

    let alive = true;
    setStatus("loading");
    setManifest(null);
    setCoverUrl("");

    (async () => {
      try {
        const m = await fetchJson(`${backendBase}/api/publish/${encodeURIComponent(shareId)}/manifest`);
        if (!alive) return;

        setManifest(m);

        // Optional cover support:
        // - manifest.coverUrl (direct)
        // - manifest.coverS3Key (sign on demand using /api/playback-url)
        const cUrl = String(m?.coverUrl || "").trim();
        const cKey = String(m?.coverS3Key || "").trim();

        if (cUrl) {
          setCoverUrl(cUrl);
        } else if (cKey) {
          const s = await fetchJson(`${backendBase}/api/playback-url?s3Key=${encodeURIComponent(cKey)}`);
          if (!alive) return;
          if (s?.ok && s?.url) setCoverUrl(String(s.url));
        }

        setStatus("ready");
      } catch {
        if (!alive) return;
        setStatus("fail");
        setManifest(null);
        setCoverUrl("");
      }
    })();

    return () => {
      alive = false;
    };
  }, [backendBase, shareId]);

  const productHref = useMemo(() => {
    if (!shareId) return "";
    return `/shop/product/${encodeURIComponent(shareId)}`;
  }, [shareId]);

  if (status === "missing-env") {
    return <ErrorPanel title="Backend missing" details="Missing VITE_ALBUM_BACKEND_URL." />;
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Shop</div>

        <div style={{ marginTop: 10, opacity: 0.85, fontWeight: 800 }}>
          Publish: {shareId ? (status === "ready" ? "READY" : status.toUpperCase()) : "NO SHAREID"}
        </div>

        {!shareId ? (
          <div style={{ marginTop: 12, ...card }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>No ShareId</div>
            <div style={{ opacity: 0.85, lineHeight: 1.6 }}>
              Add <code>?shareId=YOUR_SHARE_ID</code> to the URL, then this page will show the album thumbnail.
            </div>
          </div>
        ) : status === "fail" ? (
          <div style={{ marginTop: 12, ...card }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Could not load published album</div>
            <div style={{ opacity: 0.85, lineHeight: 1.6 }}>
              The manifest fetch failed for <code>{shareId}</code>.
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Link to={productHref} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ ...albumCard }}>
                <div style={{ width: 140, height: 140, borderRadius: 14, overflow: "hidden", border: border }}>
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Album cover"
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.06)" }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>Album</div>
                  <div style={{ marginTop: 6, opacity: 0.85, lineHeight: 1.5 }}>
                    {Array.isArray(manifest?.tracks) ? `${manifest.tracks.length} songs` : "—"}
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={pill}>Open Product →</div>
                    <div style={{ ...pill, opacity: 0.8 }}>
                      ShareId: <span style={{ fontFamily: "monospace" }}>{shareId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

const border = "1px solid rgba(255,255,255,0.14)";

const card = {
  background: "rgba(255,255,255,0.04)",
  border,
  borderRadius: 16,
  padding: 14,
};

const albumCard = {
  background: "rgba(255,255,255,0.04)",
  border,
  borderRadius: 18,
  padding: 14,
  display: "flex",
  gap: 14,
  alignItems: "center",
};

const pill = {
  padding: "9px 10px",
  borderRadius: 999,
  border,
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontWeight: 900,
  fontSize: 12,
};
