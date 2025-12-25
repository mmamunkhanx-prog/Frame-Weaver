import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import sdk from "@farcaster/frame-sdk";

const root = createRoot(document.getElementById("root")!);

root.render(
  <div style={{ 
    backgroundColor: '#12141d', 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    color: '#00f0ff',
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px'
  }}>
    Loading NeonFrame...
  </div>
);

sdk.actions.ready().then(() => {
  console.log("Farcaster Frame SDK ready");
  root.render(<App />);
}).catch((error) => {
  console.log("Running outside Farcaster or ready failed:", error);
  root.render(<App />);
});
