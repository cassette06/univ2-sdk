
import { Token } from '@uniswap/sdk-core'
import { Fetcher } from './fetcher'
import { INIT_CODE_HASH, FACTORY_ADDRESS } from './constants'
// TODO: replace the provider in these tests
describe.skip('data', () => {
  it('Token', async () => {
    const token = await Fetcher.fetchTokenData(1, '0x6B175474E89094C44Da98b954EedeAC495271d0F') // DAI
    expect(token.decimals).toEqual(18)
  })

  it('Token:CACHE', async () => {
    const token = await Fetcher.fetchTokenData(1, '0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A') // DGD
    expect(token.decimals).toEqual(9)
  })

  it('Pair', async () => {
    const token = new Token(4, '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735', 18) // DAI
    const weth = new Token(4,'0xc778417E063141139Fce010982780140Aa0cD5Ab' , 18); // WETH
    const pair = await Fetcher.fetchPairData(weth, token,  FACTORY_ADDRESS , INIT_CODE_HASH)
    expect(pair.liquidityToken.address).toEqual('0x8B22F85d0c844Cf793690F6D9DFE9F11Ddb35449')
  })
})
