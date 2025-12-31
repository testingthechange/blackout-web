import { Routes, Route, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Shop from "./pages/Shop.jsx";
import Play from "./pages/Play.jsx";
import Login from "./pages/Login.jsx";

function useAuth() {
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem("authToken")));
  useEffect(() => {
    const fn = () => setIsAuthed(Boolean(localStorage.getItem("authToken")));
    window.addEventListener("storage", fn);
    return () => window.removeEventListener("storage", fn);
  }, []);
  return { isAuthed, setIsAuthed };
}

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return children;
}

function NavLink({ to, children }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      style={{
        display: "block",
        textDecoration: "none",
        color: "white",
        fontFamily: "system-ui",
        fontWeight: 800,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.10)",
        background: active ? "rgba(255,255,255,0.12)" : "transparent",
        opacity: active ? 1 : 0.82,
      }}
    >
      {children}
    </Link>
  );
}

export default function App() {
  const loc = useLocation();
  const nav = useNavigate();
  const { isAuthed, setIsAuthed } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 30% 20%, #0b1633 0%, #060a16 55%, #04060c 100%)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900, letterSpacing: 0.3 }}>
            block radius
          </div>

          {!isAuthed ? (
            <button
              onClick={() => nav(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`)}
              style={{
                cursor: "pointer",
                color: "white",
                fontWeight: 800,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem("authToken");
                setIsAuthed(false);
                nav("/shop");
              }}
              style={{
                cursor: "pointer",
                color: "white",
                fontWeight: 800,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              Logout
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <div
            style={{
              width: 220,
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: 12,
              height: "fit-content",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900, opacity: 0.85, marginBottom: 10 }}>
              Public
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <NavLink to="/shop">Shop</NavLink>
              <NavLink to="/play">Play</NavLink>
            </div>

            <div style={{ height: 14 }} />

            <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900, opacity: 0.85, marginBottom: 10 }}>
              Internal
            </div>

            {!isAuthed ? (
              <div style={{ color: "white", opacity: 0.65, fontFamily: "system-ui", fontSize: 12, lineHeight: 1.4 }}>
                Login to access internal pages.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <NavLink to="/account">Account</NavLink>
                <NavLink to="/tools">Export/Tools</NavLink>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/shop" replace />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/play" element={<Play />} />
              <Route path="/login" element={<Login />} />

              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <div style={{ color: "white", fontFamily: "system-ui" }}>
                      <h1 style={{ marginTop: 0 }}>Account</h1>
                      <p style={{ opacity: 0.85 }}>Placeholder.</p>
                    </div>
                  </RequireAuth>
                }
              />

              <Route
                path="/tools"
                element={
                  <RequireAuth>
                    <div style={{ color: "white", fontFamily: "system-ui" }}>
                      <h1 style={{ marginTop: 0 }}>Export/Tools</h1>
                      <p style={{ opacity: 0.85 }}>Placeholder.</p>
                    </div>
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/shop" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
