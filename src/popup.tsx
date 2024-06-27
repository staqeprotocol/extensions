import logo from "data-base64:assets/logo.svg"
import { useEffect, useState } from "react"
import {
  MdOutlineCheckBox,
  MdOutlineCheckBoxOutlineBlank
} from "react-icons/md"
import {
  bitTorrent,
  bitTorrentDonau,
  bscTestnet,
  localhost,
  polygonAmoy,
  scrollSepolia
} from "src/chains"
import { createPublicClient, getAddress, getContract, http } from "viem"

import "~style.css"

import { abi } from "~StaqeProtocol.json"
import type { IMetadata, IPool } from "~types"

export const GATEWAY_URL = "https://ipfs.io/ipfs/"

const transport = http()
const batch = { multicall: true }
const addresses = {
  1337: [localhost, "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82"],
  534351: [scrollSepolia, "0x9cbD0A9D9fb8e8c1baA4687E4e8068aDA57a220f"],
  1029: [bitTorrentDonau, "0x9cbD0A9D9fb8e8c1baA4687E4e8068aDA57a220f"],
  97: [bscTestnet, "0x9cbD0A9D9fb8e8c1baA4687E4e8068aDA57a220f"],
  80002: [polygonAmoy, "0x446565A7fE06Fb89f9d6Fe855F8210dbcDe88Ee7"],
  199: [bitTorrent, "0x67980361970AAc40767187437326234c4Ac4d003"]
}
const publicClient = createPublicClient({ chain: localhost, batch, transport })

const handleIPFSUrl = (url: string) => {
  return /^ipfs/.test(url)
    ? `${GATEWAY_URL}${url.replace(/ipfs:\/\//g, "")}`
    : url
}

async function fetchMetadata(uri: string) {
  try {
    if (!uri) return undefined
    const response = await fetch(handleIPFSUrl(uri))
    if (!response.ok) return undefined
    const metadata: IMetadata = await response.json()
    metadata.image = handleIPFSUrl(metadata.image)
    metadata.banner_image = handleIPFSUrl(metadata.banner_image)
    if (metadata.tokens) {
      metadata.tokens.forEach((token) => {
        if (token.address && token.logoURI) {
          metadata.logoURIs = metadata.logoURIs || {}
          metadata.logoURIs[token.address] = handleIPFSUrl(token.logoURI)
        }
      })
    }
    return metadata
  } catch (error) {
    console.error("Failed to fetch metadata:", error)
    throw error
  }
}

function IndexPopup() {
  const [account, setAccount] = useState<`0x${string}`>()
  const [chainId, setChainId] = useState<any>(localhost.id)
  const [tempAccount, setTempAccount] = useState<`0x${string}`>()

  const [totalPools, setTotalPools] = useState<bigint>()
  const [stakerPools, setStakerPools] = useState<IPool[]>()
  const [launchPools, setLaunchPools] = useState<IPool[]>()
  const [page, setPage] = useState<bigint>()
  const perPage = 100n

  const [tab, setTab] = useState(1)
  const [address, setAddress] = useState<any>(addresses[localhost.id][1])
  const [client, setClient] = useState<any>(publicClient)
  const [blockNumber, setBlockNumber] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  const restart = () => {
    setBlockNumber("")
    setDropdownOpen(false)
    setTotalPools(undefined)
    setStakerPools(undefined)
    setLaunchPools(undefined)
    setPage(undefined)
  }

  const handleDropdownChain = (chain: any) => {
    restart()

    const client = createPublicClient({ chain, batch, transport })
    setClient(client)
    setAddress(addresses[chain.id][1])
    setChainId(chain.id)
  }

  useEffect(() => {
    const unwatch = client.watchBlockNumber({
      onBlockNumber: (blockNumber: bigint) =>
        setBlockNumber(blockNumber.toString())
    })
    const fetch = async () => {
      const contract: any = getContract({ address, abi, client })
      const getTotalPools = await contract.read.getTotalPools()
      setTotalPools(getTotalPools)
      if (getTotalPools > 0n) setPage(1n)
    }
    fetch()
    return () => unwatch()
  }, [account, client, address])

  useEffect(() => {
    if (localStorage.getItem("account")) {
      setAccount(localStorage.getItem("account") as `0x${string}`)
    }
    if (localStorage.getItem("chainId")) {
      setChainId(localStorage.getItem("chainId") as `0x${string}`)
      handleDropdownChain(
        addresses[parseInt(localStorage.getItem("chainId"))][0]
      )
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("account", account)
    localStorage.setItem("chainId", chainId)
  }, [account, chainId])

  useEffect(() => {
    if (!totalPools || !page) return
    ;(async () => {
      try {
        const isOverflow = page * perPage > totalPools
        const startId = page * perPage - perPage + 1n
        const endId = isOverflow ? totalPools : page * perPage

        const contracts = []
        for (let poolId = startId; poolId <= endId; poolId++) {
          contracts.push({
            address,
            abi,
            functionName: "getPool",
            args: [account, poolId]
          })
        }

        const poolList: { result: IPool }[] = await client.multicall({
          contracts
        })

        const stakerPools = poolList
          .map((pl, i) =>
            pl?.result?.totalStakerStakes
              ? { id: (startId + BigInt(i)).toString(), ...pl?.result }
              : undefined
          )
          .filter(Boolean)

        setStakerPools(stakerPools)

        const stakerMetadatas = await Promise.all(
          stakerPools
            .map((pool) => fetchMetadata(pool.tokenURI))
            .filter(Boolean)
        )

        const stakerPoolsWithMetadata = stakerPools.map((pool, index) => ({
          ...pool,
          metadata: stakerMetadatas[index]
        }))

        setStakerPools(stakerPoolsWithMetadata)

        console.log("poolList", poolList, account)

        const launchPools = poolList
          .map((pl, i) =>
            getAddress(pl?.result?.owner) === getAddress(account)
              ? { id: (startId + BigInt(i)).toString(), ...pl?.result }
              : undefined
          )
          .filter(Boolean)

        setLaunchPools(launchPools)

        const launchMetadatas = await Promise.all(
          launchPools
            .map((pool) => fetchMetadata(pool.tokenURI))
            .filter(Boolean)
        )

        const launchPoolsWithMetadata = launchPools.map((pool, index) => ({
          ...pool,
          metadata: launchMetadatas[index]
        }))

        setLaunchPools(launchPoolsWithMetadata)

        if (!isOverflow) {
          console.log("Page:", page)
          setPage((page) => page++)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    })()
  }, [totalPools, page, account, client, address])

  return (
    <div className="w-80 h-96 p-2 bg-slate-50 dark:bg-slate-800">
      <div className="flex flex-col h-full justify-between">
        <div className="w-full">
          <div className="flex justify-center items-center">
            <div className="relative w-10 h-10 p-0 m-0">
              <div className="absolute -left-5 -top-3 w-16 h-16">
                <img
                  src={logo}
                  alt="Staqe"
                  className="w-16 h-16"
                  onClick={() => {
                    setAccount(undefined)
                    localStorage.removeItem("account")
                  }}
                />
              </div>
            </div>
            <ul className="flex justify-between items-stretch gap-1 menu menu-horizontal bg-slate-200 dark:bg-slate-900 rounded-box text-xs">
              <li>
                <a
                  className={`${tab === 1 ? `active` : ``}`}
                  onClick={() => setTab(1)}>
                  Rewards
                </a>
              </li>
              <li>
                <a
                  className={`${tab === 2 ? `active` : ``}`}
                  onClick={() => setTab(2)}>
                  Pools
                </a>
              </li>
              <li>
                <div
                  className={`dropdown dropdown-left ${dropdownOpen ? "dropdown-open" : ""}`}>
                  <div tabIndex={0} role="button" onClick={toggleDropdown}>
                    {addresses[chainId][0].nativeCurrency.symbol}
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-20 menu p-1 shadow bg-slate-100 dark:bg-slate-950 rounded-xl w-40">
                    {addresses &&
                      Object.values(addresses).map(([chain, addr]: any) => {
                        if (!addr) return
                        return (
                          <li key={chain?.id.toString()}>
                            <a onClick={() => handleDropdownChain(chain)}>
                              {chain?.id === chainId ? (
                                <MdOutlineCheckBox />
                              ) : (
                                <MdOutlineCheckBoxOutlineBlank />
                              )}{" "}
                              {chain?.name}
                            </a>
                          </li>
                        )
                      })}
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="w-full">
          {!account && (
            <div className="flex justify-center items-center mx-2">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-700">
                  Account address:
                </div>
                <label className="input input-bordered flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4 opacity-70">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                  <input
                    type="text"
                    className="grow"
                    placeholder="0x0.."
                    onChange={(e) =>
                      setTempAccount(e.currentTarget.value as `0x${string}`)
                    }
                  />
                  <span
                    className="btn btn-xs"
                    onClick={() => {
                      restart()
                      setAccount(tempAccount)
                    }}>
                    Save
                  </span>
                </label>
              </div>
            </div>
          )}
          {account && (
            <div className="carousel carousel-center bg-slate-200 dark:bg-slate-700 rounded-box w-full p-4">
              <div className="w-full">
                <div className="flex justify-center items-center">
                  <div className="carousel carousel-center rounded-box w-full p-0">
                    {tab === 1 &&
                      (stakerPools !== undefined && stakerPools.length > 0 ? (
                        stakerPools.map((pool, i) => (
                          <div
                            key={i}
                            className="carousel-item w-60 h-40 rounded-lg shadow-md m-2 flex flex-col items-start justify-between relative overflow-hidden"
                            style={{
                              backgroundImage: pool?.metadata?.banner_image
                                ? `url(${pool.metadata.banner_image})`
                                : undefined,
                              backgroundPosition: "center",
                              backgroundSize: "cover",
                              backgroundRepeat: "no-repeat"
                            }}>
                            <div
                              className="absolute inset-0 bg-black/50"
                              aria-hidden="true"></div>
                            <a
                              href={`http://localhost:3000/pool?id=${pool.id}`}
                              target="_blank"
                              className="absolute right-0 bottom-0 bg-slate-700/30 text-xs text-slate-200 rounded-tl-lg p-2 hover:bg-slate-700/60 hover:cursor-pointer">
                              claim rewards
                            </a>
                            <div className="z-10 flex items-center gap-2 ml-1 mt-1">
                              <div className="bg-slate-200/10 h-10 w-10 mask mask-hexagon-2">
                                {pool?.metadata && (
                                  <img
                                    src={pool?.metadata?.image}
                                    alt="Pool Image"
                                    className="h-10 w-10 mask mask-hexagon-2"
                                  />
                                )}
                              </div>
                              <div className="text-xs text-slate-200">
                                {pool?.metadata?.name ?? "NO NAME"}
                              </div>
                            </div>
                            <div className="z-10">
                              <div className="text-xs text-slate-200 pl-2 pb-2">
                                <span className="text-slate-400 mr-2">
                                  Rewards:
                                </span>
                                {pool.totalRewards
                                  ? pool.totalRewards.toString()
                                  : `0`}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col justify-center items-center w-full text-slate-500">
                          <svg
                            fill="none"
                            viewBox="0 0 24 24"
                            className="w-24 h-24">
                            <path
                              fill="currentColor"
                              fillRule="evenodd"
                              d="M18 6H5a3 3 0 00-3 3v6a3 3 0 003 3h13a3 3 0 003-3 1 1 0 001-1v-4a1 1 0 00-1-1 3 3 0 00-3-3zm0 2H5a1 1 0 00-1 1v6a1 1 0 001 1h13a1 1 0 001-1V9a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>No Rewards</div>
                        </div>
                      ))}
                    {tab === 2 &&
                      (launchPools !== undefined && launchPools.length > 0 ? (
                        launchPools.map((pool, i) => (
                          <div
                            key={i}
                            className="carousel-item w-60 h-40 rounded-lg shadow-md m-2 flex flex-col items-start justify-between relative overflow-hidden"
                            style={{
                              backgroundImage: pool?.metadata?.banner_image
                                ? `url(${pool.metadata.banner_image})`
                                : undefined,
                              backgroundPosition: "center",
                              backgroundSize: "cover",
                              backgroundRepeat: "no-repeat"
                            }}>
                            <div
                              className="absolute inset-0 bg-black/50"
                              aria-hidden="true"></div>
                            <a
                              href={`http://localhost:3000/pool?id=${pool.id}`}
                              target="_blank"
                              className="absolute right-0 bottom-0 bg-slate-700/30 text-xs text-slate-200 rounded-tl-lg p-2 hover:bg-slate-700/60 hover:cursor-pointer">
                              add rewards
                            </a>
                            <div className="z-10 flex items-center gap-2 ml-1 mt-1">
                              <div className="bg-slate-200/10 h-10 w-10 mask mask-hexagon-2">
                                {pool?.metadata && (
                                  <img
                                    src={pool?.metadata?.image}
                                    alt="Pool Image"
                                    className="h-10 w-10 mask mask-hexagon-2"
                                  />
                                )}
                              </div>
                              <div className="text-xs text-slate-200">
                                {pool?.metadata?.name ?? "NO NAME"}
                              </div>
                            </div>
                            <div className="z-10">
                              <div className="text-xs text-slate-200 pl-2 pb-2">
                                <span className="text-slate-400 mr-2">
                                  Rewards:
                                </span>
                                {pool.totalRewards
                                  ? pool.totalRewards.toString()
                                  : `0`}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col justify-center items-center w-full text-slate-500">
                          <svg
                            fill="none"
                            viewBox="0 0 24 24"
                            className="w-24 h-24">
                            <path
                              fill="currentColor"
                              fillRule="evenodd"
                              d="M18 6H5a3 3 0 00-3 3v6a3 3 0 003 3h13a3 3 0 003-3 1 1 0 001-1v-4a1 1 0 00-1-1 3 3 0 00-3-3zm0 2H5a1 1 0 00-1 1v6a1 1 0 001 1h13a1 1 0 001-1V9a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>No Pools</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="w-full">
          <div className="flex justify-between items-centertext-xs text-gray-400">
            <div>Staqe v0.0.2</div>
            <div>{tempAccount && tempAccount.slice(0, 5) + `...`}</div>
            {blockNumber ? (
              <div className="flex justify-center items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mx-2"></span>
                <span>{blockNumber}</span>
              </div>
            ) : (
              <div className="flex justify-center items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mx-2"></span>
                <span>offline</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup
