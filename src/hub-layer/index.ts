import { ethers, BigNumber } from "ethers";
import depositArtifact from "./abi/L1BuildDeposit.json";
import agentArtifact from "./abi/L1BuildAgent.json";

type provider = ethers.providers.JsonRpcProvider;

type address = string;

type NamedContracts = {
  Lib_AddressManager: string;
  BondManager: string;
  CanonicalTransactionChain: string;
  "ChainStorageContainer-CTC-batches": string;
  "ChainStorageContainer-SCC-batches": string;
  L2CrossDomainMessenger: string;
  OVM_L1CrossDomainMessenger: string;
  OVM_Proposer: string;
  OVM_Sequencer: string;
  Proxy__OVM_L1CrossDomainMessenger: string;
  Proxy__OVM_L1ERC721Bridge: string;
  Proxy__OVM_L1StandardBridge: string;
  StateCommitmentChain: string;
};

const getL1BuildDeposit = (provider: provider) => {
  return new ethers.Contract(
    "0x5200000000000000000000000000000000000007",
    depositArtifact.abi,
    provider
  );
};

const getL1BuildAgent = (provider: provider) => {
  return new ethers.Contract(
    "0x5200000000000000000000000000000000000008",
    agentArtifact.abi,
    provider
  );
};

const getBuilts = async (
  provider: provider
): Promise<[address[], BigNumber[]]> => {
  const agent = getL1BuildAgent(provider);

  let builders: string[] = [];
  let chainIds: BigNumber[] = [];
  let cursor: BigNumber = BigNumber.from(0);

  while (true) {
    const [_builders, _chainIds, newCursor] = await agent.getBuilts(
      cursor,
      200
    );
    if (_builders.length === 0) break;

    builders = builders.concat(_builders);
    chainIds = chainIds.concat(_chainIds);
    cursor = newCursor;
  }

  return [builders, chainIds];
};

const getBuilder = async (
  provider: provider,
  txhash: string
): Promise<string> => {
  const deposit = getL1BuildDeposit(provider);

  // Get a receipt and event for the birth build transaction from the Hub-Layer.
  const receipt = await provider.getTransactionReceipt(txhash);
  if (!receipt) throw Error("Transaction not found");

  const events = (await deposit.queryFilter("Build", receipt.blockHash)).filter(
    (x) => x.transactionHash.toLowerCase() === txhash.toLowerCase()
  );
  if (events.length === 0) throw Error("Build event not found");

  return events[0].args!.builder;
};

const getChainId = async (
  provider: provider,
  builder: address
): Promise<number> => {
  const [builders, chainIds] = await getBuilts(provider);

  const chainId = chainIds.filter(
    (_, i) => builders[i].toLowerCase() === builder.toLowerCase()
  )[0];
  if (!chainId) throw Error("Chain ID not found");

  return chainId.toNumber();
};

const getNamedContracts = async (
  provider: provider,
  chainId: number
): Promise<NamedContracts> => {
  const agent = getL1BuildAgent(provider);

  const ret: { [name: address]: string } = {
    Lib_AddressManager: await agent.getAddressManager(chainId),
  };

  const [names, addresses] = await agent.getNamedAddresses(chainId);
  (names as address[]).forEach((name, i) => {
    ret[name] = addresses[i];
  });

  return ret as NamedContracts;
};

export type { NamedContracts };

export {
  getL1BuildDeposit,
  getL1BuildAgent,
  getBuilts,
  getBuilder,
  getChainId,
  getNamedContracts,
};
