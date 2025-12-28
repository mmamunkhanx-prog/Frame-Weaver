import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import sdk from "@farcaster/frame-sdk";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

// ১. Wagmi কনফিগারেশন তৈরি (এটি সঠিক ওয়ালেট কানেক্ট নিশ্চিত করবে)
const config = createConfig({
  chains: [base],
  connectors: [farcasterFrame()],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();
const root = createRoot(document.getElementById("root")!);

// ২. শুরুতে লোডিং স্ক্রিন দেখানো
root.render(
  <div style={{
    backgroundColor: '#12141d',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00F0FF',
    fontFamily: 'Orbitron, sans-serif',
    fontSize: '18px'
  }}>
    Loading NeonFrame...
  </div>
);

// ৩. Farcaster SDK রেডি হলে অ্যাপ চালু করা
sdk.actions.ready().then(() => {
  console.log("Farcaster Frame SDK ready");
  root.render(
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  );
}).catch((error) => {
  console.error("Farcaster ready failed:", error);
  root.render(<App />);
});
