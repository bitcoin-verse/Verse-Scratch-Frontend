import { polygon } from 'viem/chains'
import { defaultWagmiConfig } from '@web3modal/wagmi/vue'

let isWallet = false

// dont have anything in session storage yet
if (!sessionStorage.getItem('isWallet')) {
  const search = new URLSearchParams(window.location.search)
  isWallet = search.get('origin') === 'wallet'
  sessionStorage.setItem('isWallet', isWallet)
} else {
  isWallet = sessionStorage.getItem('isWallet') == 'true'
}

const projectId = '5d9e3863443e82e9222f3e3f5e075798'
const chains = [polygon]
const metadata = {
  name: "VERSE Scratcher",
  description: "Unveiling our first space expedition themed Scratch Tickets powered by VERSE - your instant path to fun and fortune",
  url: "https://scratcher.verse.bitcoin.com",
  icons: ["https://scratcher.verse.bitcoin.com/icon.png"],
}
const config = defaultWagmiConfig({
    chains, 
    isWallet,
    projectId, 
    metadata, 
    enableWalletConnect: true, 
    enableInjected: true,
    enableEIP6963: true, 
    enableCoinbase: false,
})


export default {
    config,
    isWallet,
    projectId
}


