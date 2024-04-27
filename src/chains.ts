import { localhost as l, scrollSepolia } from "viem/chains";

const localhost = {
    ...l,
    contracts: {
        multicall3: {
            address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`
        }
    }
};

export { localhost, scrollSepolia };
