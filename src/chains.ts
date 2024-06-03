import { defineChain } from "viem"
import {
  avalancheFuji,
  bscTestnet,
  localhost as l,
  polygonAmoy,
  scrollSepolia
} from "viem/chains"

const localhost = {
  ...l,
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`
    }
  }
}

const bitTorrent = defineChain({
  id: 1029,
  name: "BitTorrent Chain Donau",
  nativeCurrency: { name: "BitTorrent", symbol: "BTT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://pre-rpc.bittorrentchain.io/"] }
  },
  blockExplorers: {
    default: { name: "BitTorrent", url: "https://testscan.bt.io" }
  },
  contracts: {
    multicall3: {
      address: "0x5608020135e7Eb9a1ef6683aD4988200eA5Cfcbf"
    }
  }
})

export {
  avalancheFuji,
  bitTorrent,
  bscTestnet,
  localhost,
  polygonAmoy,
  scrollSepolia
}
