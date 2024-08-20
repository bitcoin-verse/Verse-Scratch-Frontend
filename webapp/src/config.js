import { coinbaseWallet, injected, walletConnect } from '@wagmi/connectors'

import { http, createConfig } from '@wagmi/core'
import { polygon } from '@wagmi/core/chains'

export const getWagmiConfig = () => {
  const projectId = '5d9e3863443e82e9222f3e3f5e075798'
  const metadata = {
    name: "VERSE Scratcher",
    description: "Unveiling our first space expedition themed Scratch Tickets powered by VERSE - your instant path to fun and fortune",
    url: "https://scratcher.verse.bitcoin.com",
    icons: ["https://scratcher.verse.bitcoin.com/icon.png"],
  };
  let isWallet = false;
  if (!sessionStorage.getItem('isWallet')) {
    const search = new URLSearchParams(window.location.search);
    isWallet = search.get("origin") === "wallet";
    sessionStorage.setItem('isWallet', isWallet);
  } else {
    if (sessionStorage.getItem('isWallet') == "true") {
      isWallet = true
    } else {
      isWallet = false
    }
  }

  return createConfig({
    autoConnect: true,
    chains: [polygon],
    transports: {
      [polygon.id]: http('https://polygon-rpc.com'),
    },
    connectors: [
      walletConnect({
        projectId,
      }),
      ...(isWallet === true
        ? []
        : [
          injected({ shimDisconnect: true }),
          coinbaseWallet({
            appName: metadata.name
          }),
        ]),
    ],
  })
}