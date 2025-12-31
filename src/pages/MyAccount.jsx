import { useSearchParams } from "react-router-dom";

export default function MyAccount() {
  const [params] = useSearchParams();
  const shareId = params.get("shareId");

  return (
    <div style={{ padding: 40 }}>
      <h1>MyAccount</h1>
      <p>shareId: {shareId}</p>
    </div>
  );
}
