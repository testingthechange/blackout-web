import MyAccount from "./components/MyAccount";

export default function App() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Mini-site UI</h1>
      <MyAccount shareId="test" />
    </div>
  );
}
