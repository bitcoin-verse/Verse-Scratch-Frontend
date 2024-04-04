import { polygon, mainnet } from 'viem/chains'
import { defaultWagmiConfig } from '@web3modal/wagmi/vue'


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
    projectId, 
    metadata, 
    enableWalletConnect: true, 
    enableInjected: true,
    enableEIP6963: true, 
    enableCoinbase: true 
})


export default {
    config
}


