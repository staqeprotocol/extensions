export interface IToken {
    tokenAddress: `0x${string}`;
    name: string;
    symbol: string;
    decimals: bigint;
    balance: bigint;
}

export interface IPool {
    id?: string;
    stakeERC20: IToken;
    stakeERC721: IToken;
    rewardToken: IToken;
    totalMax: bigint,
    totalStakedERC20: bigint;
    totalStakedERC721: bigint;
    launchBlock: bigint;
    owner: `0x${string}`;
    tokenURI: string;
    totalRewards: bigint;
    totalStakerStakes: bigint;
    metadata?: IMetadata
}

export interface IMetadata {
    name: string;
    description: string;
    image: string;
    external_url?: string;
    background_color?: string;
    banner_image?: string;
    attributes?: {
        trait_type: string;
        value: `0x${string}`;
    }[];
    tokens?: {
        chainId: number;
        address: `0x${string}`;
        symbol: string;
        name: string;
        decimals: number;
        logoURI: string;
        tags: string[];
    }[];
    timestamp?: string;
    logoURIs?: { [address: `0x${string}`]: string }
}