import { defineChain } from "viem"
import {
  avalancheFuji,
  bscTestnet,
  bitTorrent as btt,
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

const bitTorrentDonau = defineChain({
  id: 1029,
  name: "BitTorrent Chain Donau",
  nativeCurrency: { name: "BitTorrent", symbol: "tBTT", decimals: 18 },
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

const bitTorrent = defineChain({
  ...btt,
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11"
    }
  }
})

const taikoHekla = /*#__PURE__*/ defineChain({
  id: 167_009,
  name: "Taiko Hekla L2",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.hekla.taiko.xyz"]
    }
  },
  blockExplorers: {
    default: {
      name: "Taikoscan",
      url: "https://hekla.taikoscan.network"
    }
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11"
    }
  },
  testnet: true
})

export {
  avalancheFuji,
  bitTorrent,
  bitTorrentDonau,
  bscTestnet,
  localhost,
  polygonAmoy,
  scrollSepolia,
  taikoHekla
}
