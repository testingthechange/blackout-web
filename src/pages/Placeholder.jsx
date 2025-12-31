export default function Placeholder({ title, note }) {
  return (
    <div style={{ color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ marginTop: 0, fontSize: 44, letterSpacing: -0.6 }}>{title}</h1>
      <p style={{ opacity: 0.85, maxWidth: 760, lineHeight: 1.5 }}>
        {note || "Placeholder page. We’ll wire real UI here next."}
      </p>
    </div>
  );
}
