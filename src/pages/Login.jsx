import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = useMemo(() => params.get("next") || "/account", [params]);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!email.trim() || !pw.trim()) {
      setErr("Enter email + password (stub).");
      return;
    }

    // Stub auth (upgrade later)
    localStorage.setItem("authToken", "dev");
    localStorage.setItem("authEmail", email.trim());

    navigate(next, { replace: true });
  }

  return (
    <div style={{ color: "white", fontFamily: "system-ui", maxWidth: 520 }}>
      <h1 style={{ marginTop: 0, fontSize: 44, letterSpacing: -0.6 }}>Login</h1>
      <p style={{ opacity: 0.85, lineHeight: 1.5 }}>
        Stub login. Stores a token in localStorage so we can guard internal pages now and upgrade later.
      </p>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: 18,
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 14,
          padding: 18,
          background: "rgba(255,255,255,0.06)",
        }}
      >
        <label style={{ display: "block", opacity: 0.85, fontWeight: 700 }}>Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            marginTop: 8,
            padding: "12px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            outline: "none",
          }}
        />

        <label style={{ display: "block", marginTop: 14, opacity: 0.85, fontWeight: 700 }}>Password</label>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••••"
          style={{
            width: "100%",
            marginTop: 8,
            padding: "12px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(0,0,0,0.25)",
            color: "white",
            outline: "none",
          }}
        />

        {err && <div style={{ marginTop: 12, color: "#ff9a9a", fontWeight: 700 }}>{err}</div>}

        <button
          type="submit"
          style={{
            marginTop: 16,
            width: "100%",
            cursor: "pointer",
            color: "white",
            fontWeight: 900,
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
          }}
        >
          Login
        </button>

        <div style={{ marginTop: 12, opacity: 0.7, fontSize: 12 }}>
          Next: <span style={{ opacity: 0.95 }}>{next}</span>
        </div>
      </form>
    </div>
  );
}
