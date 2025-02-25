import { http } from "@wagmi/core"
import { polygon, mainnet } from "@reown/appkit/networks"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { walletConnect, injected, coinbaseWallet } from "@wagmi/connectors"

let isWallet = false

// dont have anything in session storage yet
if (!sessionStorage.getItem("isWallet")) {
  const search = new URLSearchParams(window.location.search)
  isWallet = search.get("origin") === "wallet"
  sessionStorage.setItem("isWallet", isWallet)
} else {
  isWallet = sessionStorage.getItem("isWallet") == "true"
}

const projectId = "5d9e3863443e82e9222f3e3f5e075798"
const networks = [polygon, mainnet];
const metadata = {
    name: "VERSE Scratcher",
    description: "Unveiling our first space expedition themed Scratch Tickets powered by VERSE - your instant path to fun and fortune",
    url: "https://scratcher.verse.bitcoin.com",
    icons: ["https://scratcher.verse.bitcoin.com/icon.png"],
};

const connectors = [];
connectors.push(
  walletConnect({ projectId, showQrModal: false, metadata }),
);
if (isWallet) {
  connectors.push(injected({ shimDisconnect: true }))
  connectors.push(coinbaseWallet({ appName: metadata.name }))
}

const wagmiAdapter = new WagmiAdapter({
  wagmiChains: networks,
  projectId,
  networks,
  connectors,
  transports: {
    [polygon.id]: http(),
    [mainnet.id]: http(),
  },
});

export default {
    projectId,
    networks,
    metadata,
    wagmiAdapter,
    config: wagmiAdapter.wagmiConfig,
    isWallet
}