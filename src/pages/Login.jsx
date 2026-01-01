import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/shop";

  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0 }}>Login (Stub)</h1>
      <p style={{ opacity: 0.85 }}>Sets a localStorage token. Clerk later.</p>

      <button
        onClick={() => {
          localStorage.setItem("authToken", "dev-token");
          nav(next);
        }}
        style={{
          cursor: "pointer",
          color: "white",
          fontWeight: 900,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.06)",
          fontFamily: "system-ui",
        }}
      >
        Login
      </button>
    </div>
  );
}
