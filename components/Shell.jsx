import { useLocation, useNavigate } from "react-router-dom";
import LeftNav from "./LeftNav.jsx";
import { useAuth } from "../auth/useAuth.js";

export default function Shell({ children }) {
  const { isAuthed, email, logout } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at 30% 20%, #0b1633 0%, #060a16 55%, #04060c 100%)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "18px 18px 60px" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ color: "white", fontFamily: "system-ui", fontWeight: 900, letterSpacing: 0.3 }}>
            block radius
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "white", fontFamily: "system-ui" }}>
            {isAuthed ? (
              <>
                <div style={{ opacity: 0.75, fontSize: 12 }}>{email || "logged in"}</div>
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
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
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
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
          <LeftNav />
          <div style={{ flex: 1, minWidth: 0 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
