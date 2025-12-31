import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function NavBar() {
  const { isAuthed, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  const tabStyle = (active) => ({
    textDecoration: "none",
    color: "white",
    opacity: active ? 1 : 0.75,
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 10,
    background: active ? "rgba(255,255,255,0.10)" : "transparent",
    border: "1px solid rgba(255,255,255,0.10)",
  });

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(10px)",
        background: "rgba(0,0,0,0.25)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontWeight: 900, letterSpacing: 0.3 }}>minisite</div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/shop" style={tabStyle(loc.pathname === "/shop" || loc.pathname === "/")}>
              Shop
            </Link>
            <Link to="/play?shareId=2b5b538e60429a31" style={tabStyle(loc.pathname === "/play")}>
              Play
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isAuthed ? (
            <button
              onClick={() => navigate(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`)}
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
            <>
              <Link to="/account" style={tabStyle(loc.pathname === "/account")}>
                Account
              </Link>
              <button
                onClick={logout}
                style={{
                  cursor: "pointer",
                  color: "white",
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.06)",
                  opacity: 0.9,
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
