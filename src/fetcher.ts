import { Contract } from '@ethersproject/contracts'
import { BytesLike } from "@ethersproject/bytes";
import { Token, CurrencyAmount } from '@uniswap/sdk-core'
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'
import { Pair, computePairAddress } from './entities/pair'
import JSBI from 'jsbi'
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import invariant from 'tiny-invariant'
import ERC20 from './abis/ERC20.json'

let TOKEN_DECIMALS_CACHE: { [chainId: number]: { [address: string]: number } } = {
  [1]: {
    '0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A': 9 // DGD
  }
}

/**
 * Contains methods for constructing instances of pairs and tokens from on-chain data.
 */
export abstract class Fetcher {
  /**
   * Cannot be constructed.
   */
  private constructor() {}

  /**
   * Fetch information for a given token on the given chain, using the given ethers provider.
   * @param chainId chain of the token
   * @param address address of the token on the chain
   * @param provider provider used to fetch the token
   * @param symbol optional symbol of the token
   * @param name optional name of the token
   */
  public static async fetchTokenData(
    chainId: number,
    address: string,
    provider = getDefaultProvider(getNetwork(chainId)),
    symbol?: string,
    name?: string
  ): Promise<Token> {
    const parsedDecimals =
      typeof TOKEN_DECIMALS_CACHE?.[chainId]?.[address] === 'number'
        ? TOKEN_DECIMALS_CACHE[chainId][address]
        : await new Contract(address, ERC20, provider).decimals().then((decimals: number): number => {
            TOKEN_DECIMALS_CACHE = {
              ...TOKEN_DECIMALS_CACHE,
              [chainId]: {
                ...TOKEN_DECIMALS_CACHE?.[chainId],
                [address]: decimals
              }
            }
            return decimals
          })
    return new Token(chainId, address, parsedDecimals, symbol, name)
  }

  /**
   * Fetches information about a pair and constructs a pair from the given two tokens.
   * @param tokenA first token
   * @param tokenB second token
   * @param provider the provider to use to fetch the data
   */
  public static async fetchPairData(
    tokenA: Token,
    tokenB: Token,
    factoryAddr: string,
    initCodeHash: BytesLike,
    provider = getDefaultProvider(getNetwork(tokenA.chainId)),
  ): Promise<Pair> {
    invariant(tokenA.chainId === tokenB.chainId, 'CHAIN_ID')
    const address = computePairAddress({factoryAddress: factoryAddr, initCodeHash: initCodeHash, tokenA, tokenB})
    const [reserves0, reserves1] = await new Contract(address, IUniswapV2Pair.abi, provider).getReserves()
    const balances = tokenA.sortsBefore(tokenB) ? [reserves0, reserves1] : [reserves1, reserves0]
    return new Pair(CurrencyAmount.fromRawAmount(tokenA, JSBI.BigInt(balances[0])), CurrencyAmount.fromRawAmount(tokenB, JSBI.BigInt(balances[1])), factoryAddr, initCodeHash)
  }
}