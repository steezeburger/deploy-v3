import UniswapV3Factory from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from "@ethersproject/providers";
import { MigrationStep, waitForNextBlock, waitForReceipt } from '../migrations'

const ONE_BP_FEE = 100
const ONE_BP_TICK_SPACING = 1

export const ADD_1BP_FEE_TIER: MigrationStep = async (state, { signer, gasPrice, jsonRpcUrl }) => {
  if (state.v3CoreFactoryAddress === undefined) {
    throw new Error('Missing UniswapV3Factory')
  }

  const v3CoreFactory = new Contract(state.v3CoreFactoryAddress, UniswapV3Factory.abi, signer)

  const provider = new JsonRpcProvider({ url: jsonRpcUrl.toString() })
  let currBlock = await provider.getBlockNumber()

  const owner = await v3CoreFactory.owner()
  if (owner !== (await signer.getAddress())) {
    throw new Error('UniswapV3Factory.owner is not signer')
  }
  const tx = await v3CoreFactory.enableFeeAmount(ONE_BP_FEE, ONE_BP_TICK_SPACING, { gasPrice })

  await waitForReceipt(tx.hash, provider)
  await waitForNextBlock(currBlock, provider)

  return [
    {
      message: `UniswapV3Factory added a new fee tier ${ONE_BP_FEE / 100} bps with tick spacing ${ONE_BP_TICK_SPACING}`,
      hash: tx.hash,
    },
  ]
}
