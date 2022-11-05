/**
 * @oasysgames/oasys-optimism
 * https://github.com/oasysgames/oasys-optimism/blob/20eff6890c0b64dc9e8a1e36f347c4d561a1e411/packages/contracts/tasks/take-dump.ts
 */

import { L2ContractAddresses, ZeroAddress } from "../consts";
import { remove0x } from "../smock/hex-utils";
import { computeStorageSlots } from "../smock/storage";
import type { NamedContracts } from "../hub-layer";

interface GenesisParams {
  chainId: number;
  ovmWhitelistOwner: string;
  ovmGasPriceOracleOwner: string;
  ovmFeeWalletAddress: string;
  ovmBlockSignerAddress: string;
  gasPriceOracleL2GasPrice: number;
  gasPriceOracleL1BaseFee: number;
  gasPriceOracleOverhead: number;
  gasPriceOracleScalar: number;
  gasPriceOracleDecimals: number;
  hfBerlinBlock: number;
  l2BlockGasLimit: number;
}

// https://github.com/oasysgames/oasys-optimism/tree/20eff6890c0b64dc9e8a1e36f347c4d561a1e411/packages/contracts
const Commit = "20eff6890c0b64dc9e8a1e36f347c4d561a1e411";

const L2ContractStorages: { [name: string]: any } = {
  OVM_DeployerWhitelist: {
    storage: [
      {
        astId: 9496,
        contract:
          "contracts/L2/predeploys/OVM_DeployerWhitelist.sol:OVM_DeployerWhitelist",
        label: "owner",
        offset: 0,
        slot: "0",
        type: "t_address",
      },
      {
        astId: 9500,
        contract:
          "contracts/L2/predeploys/OVM_DeployerWhitelist.sol:OVM_DeployerWhitelist",
        label: "whitelist",
        offset: 0,
        slot: "1",
        type: "t_mapping(t_address,t_bool)",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
      t_bool: { encoding: "inplace", label: "bool", numberOfBytes: "1" },
      "t_mapping(t_address,t_bool)": {
        encoding: "mapping",
        key: "t_address",
        label: "mapping(address => bool)",
        numberOfBytes: "32",
        value: "t_bool",
      },
    },
  },
  L2CrossDomainMessenger: {
    storage: [
      {
        astId: 8948,
        contract:
          "contracts/L2/messaging/L2CrossDomainMessenger.sol:L2CrossDomainMessenger",
        label: "relayedMessages",
        offset: 0,
        slot: "0",
        type: "t_mapping(t_bytes32,t_bool)",
      },
      {
        astId: 8952,
        contract:
          "contracts/L2/messaging/L2CrossDomainMessenger.sol:L2CrossDomainMessenger",
        label: "successfulMessages",
        offset: 0,
        slot: "1",
        type: "t_mapping(t_bytes32,t_bool)",
      },
      {
        astId: 8956,
        contract:
          "contracts/L2/messaging/L2CrossDomainMessenger.sol:L2CrossDomainMessenger",
        label: "sentMessages",
        offset: 0,
        slot: "2",
        type: "t_mapping(t_bytes32,t_bool)",
      },
      {
        astId: 8958,
        contract:
          "contracts/L2/messaging/L2CrossDomainMessenger.sol:L2CrossDomainMessenger",
        label: "messageNonce",
        offset: 0,
        slot: "3",
        type: "t_uint256",
      },
      {
        astId: 8962,
        contract:
          "contracts/L2/messaging/L2CrossDomainMessenger.sol:L2CrossDomainMessenger",
        label: "xDomainMsgSender",
        offset: 0,
        slot: "4",
        type: "t_address",
      },
      {
        astId: 8964,
        contract:
          "contracts/L2/messaging/L2CrossDomainMessenger.sol:L2CrossDomainMessenger",
        label: "l1CrossDomainMessenger",
        offset: 0,
        slot: "5",
        type: "t_address",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
      t_bool: { encoding: "inplace", label: "bool", numberOfBytes: "1" },
      t_bytes32: { encoding: "inplace", label: "bytes32", numberOfBytes: "32" },
      "t_mapping(t_bytes32,t_bool)": {
        encoding: "mapping",
        key: "t_bytes32",
        label: "mapping(bytes32 => bool)",
        numberOfBytes: "32",
        value: "t_bool",
      },
      t_uint256: { encoding: "inplace", label: "uint256", numberOfBytes: "32" },
    },
  },
  OVM_GasPriceOracle: {
    storage: [
      {
        astId: 977,
        contract:
          "contracts/L2/predeploys/OVM_GasPriceOracle.sol:OVM_GasPriceOracle",
        label: "_owner",
        offset: 0,
        slot: "0",
        type: "t_address",
      },
      {
        astId: 9713,
        contract:
          "contracts/L2/predeploys/OVM_GasPriceOracle.sol:OVM_GasPriceOracle",
        label: "gasPrice",
        offset: 0,
        slot: "1",
        type: "t_uint256",
      },
      {
        astId: 9715,
        contract:
          "contracts/L2/predeploys/OVM_GasPriceOracle.sol:OVM_GasPriceOracle",
        label: "l1BaseFee",
        offset: 0,
        slot: "2",
        type: "t_uint256",
      },
      {
        astId: 9717,
        contract:
          "contracts/L2/predeploys/OVM_GasPriceOracle.sol:OVM_GasPriceOracle",
        label: "overhead",
        offset: 0,
        slot: "3",
        type: "t_uint256",
      },
      {
        astId: 9719,
        contract:
          "contracts/L2/predeploys/OVM_GasPriceOracle.sol:OVM_GasPriceOracle",
        label: "scalar",
        offset: 0,
        slot: "4",
        type: "t_uint256",
      },
      {
        astId: 9721,
        contract:
          "contracts/L2/predeploys/OVM_GasPriceOracle.sol:OVM_GasPriceOracle",
        label: "decimals",
        offset: 0,
        slot: "5",
        type: "t_uint256",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
      t_uint256: { encoding: "inplace", label: "uint256", numberOfBytes: "32" },
    },
  },
  L2StandardBridge: {
    storage: [
      {
        astId: 10569,
        contract:
          "contracts/L2/messaging/L2StandardBridge.sol:L2StandardBridge",
        label: "messenger",
        offset: 0,
        slot: "0",
        type: "t_address",
      },
      {
        astId: 9182,
        contract:
          "contracts/L2/messaging/L2StandardBridge.sol:L2StandardBridge",
        label: "l1TokenBridge",
        offset: 0,
        slot: "1",
        type: "t_address",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
    },
  },
  OVM_SequencerFeeVault: {
    storage: [
      {
        astId: 9980,
        contract:
          "contracts/L2/predeploys/OVM_SequencerFeeVault.sol:OVM_SequencerFeeVault",
        label: "l1FeeWallet",
        offset: 0,
        slot: "0",
        type: "t_address",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
    },
  },
  OVM_ETH: {
    storage: [
      {
        astId: 1181,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "_balances",
        offset: 0,
        slot: "0",
        type: "t_mapping(t_address,t_uint256)",
      },
      {
        astId: 1187,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "_allowances",
        offset: 0,
        slot: "1",
        type: "t_mapping(t_address,t_mapping(t_address,t_uint256))",
      },
      {
        astId: 1189,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "_totalSupply",
        offset: 0,
        slot: "2",
        type: "t_uint256",
      },
      {
        astId: 1191,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "_name",
        offset: 0,
        slot: "3",
        type: "t_string_storage",
      },
      {
        astId: 1193,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "_symbol",
        offset: 0,
        slot: "4",
        type: "t_string_storage",
      },
      {
        astId: 20418,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "l1Token",
        offset: 0,
        slot: "5",
        type: "t_address",
      },
      {
        astId: 20420,
        contract: "contracts/L2/predeploys/OVM_ETH.sol:OVM_ETH",
        label: "l2Bridge",
        offset: 0,
        slot: "6",
        type: "t_address",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
      "t_mapping(t_address,t_mapping(t_address,t_uint256))": {
        encoding: "mapping",
        key: "t_address",
        label: "mapping(address => mapping(address => uint256))",
        numberOfBytes: "32",
        value: "t_mapping(t_address,t_uint256)",
      },
      "t_mapping(t_address,t_uint256)": {
        encoding: "mapping",
        key: "t_address",
        label: "mapping(address => uint256)",
        numberOfBytes: "32",
        value: "t_uint256",
      },
      t_string_storage: {
        encoding: "bytes",
        label: "string",
        numberOfBytes: "32",
      },
      t_uint256: { encoding: "inplace", label: "uint256", numberOfBytes: "32" },
    },
  },
  WETH9: {
    storage: [
      {
        astId: 4,
        contract: "contracts/L2/predeploys/WETH9.sol:WETH9",
        label: "name",
        offset: 0,
        slot: "0",
        type: "t_string_storage",
      },
      {
        astId: 7,
        contract: "contracts/L2/predeploys/WETH9.sol:WETH9",
        label: "symbol",
        offset: 0,
        slot: "1",
        type: "t_string_storage",
      },
      {
        astId: 10,
        contract: "contracts/L2/predeploys/WETH9.sol:WETH9",
        label: "decimals",
        offset: 0,
        slot: "2",
        type: "t_uint8",
      },
      {
        astId: 42,
        contract: "contracts/L2/predeploys/WETH9.sol:WETH9",
        label: "balanceOf",
        offset: 0,
        slot: "3",
        type: "t_mapping(t_address,t_uint256)",
      },
      {
        astId: 48,
        contract: "contracts/L2/predeploys/WETH9.sol:WETH9",
        label: "allowance",
        offset: 0,
        slot: "4",
        type: "t_mapping(t_address,t_mapping(t_address,t_uint256))",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
      "t_mapping(t_address,t_mapping(t_address,t_uint256))": {
        encoding: "mapping",
        key: "t_address",
        label: "mapping(address => mapping(address => uint256))",
        numberOfBytes: "32",
        value: "t_mapping(t_address,t_uint256)",
      },
      "t_mapping(t_address,t_uint256)": {
        encoding: "mapping",
        key: "t_address",
        label: "mapping(address => uint256)",
        numberOfBytes: "32",
        value: "t_uint256",
      },
      t_string_storage: {
        encoding: "bytes",
        label: "string",
        numberOfBytes: "32",
      },
      t_uint256: { encoding: "inplace", label: "uint256", numberOfBytes: "32" },
      t_uint8: { encoding: "inplace", label: "uint8", numberOfBytes: "1" },
    },
  },
  L2ERC721Bridge: {
    storage: [
      {
        astId: 10569,
        contract:
          "contracts/oasys/L2/messaging/L2ERC721Bridge.sol:L2ERC721Bridge",
        label: "messenger",
        offset: 0,
        slot: "0",
        type: "t_address",
      },
      {
        astId: 19605,
        contract:
          "contracts/oasys/L2/messaging/L2ERC721Bridge.sol:L2ERC721Bridge",
        label: "l1ERC721Bridge",
        offset: 0,
        slot: "1",
        type: "t_address",
      },
    ],
    types: {
      t_address: { encoding: "inplace", label: "address", numberOfBytes: "20" },
    },
  },
} as const;

const getContractArtifact = async (
  name: string
): Promise<{ deployedBytecode: string }> => {
  const content = import(`./abi/${Commit.slice(0, 10)}/${name}.json`);
  return await content;
};

const makeGenesisJson = async (
  params: GenesisParams,
  contracts: NamedContracts
) => {
  const variables: { [name: string]: any } = {
    OVM_DeployerWhitelist: {
      owner: params.ovmWhitelistOwner,
    },
    OVM_GasPriceOracle: {
      _owner: params.ovmGasPriceOracleOwner,
      gasPrice: params.gasPriceOracleL2GasPrice,
      l1BaseFee: params.gasPriceOracleL1BaseFee,
      overhead: params.gasPriceOracleOverhead,
      scalar: params.gasPriceOracleScalar,
      decimals: params.gasPriceOracleDecimals,
    },
    L2StandardBridge: {
      l1TokenBridge: contracts.Proxy__OVM_L1StandardBridge,
      messenger: L2ContractAddresses.L2CrossDomainMessenger,
    },
    L2ERC721Bridge: {
      l1ERC721Bridge: contracts.Proxy__OVM_L1ERC721Bridge,
      messenger: L2ContractAddresses.L2CrossDomainMessenger,
    },
    OVM_SequencerFeeVault: {
      l1FeeWallet: params.ovmFeeWalletAddress,
    },
    OVM_ETH: {
      l2Bridge: L2ContractAddresses.L2StandardBridge,
      l1Token: ZeroAddress,
      _name: "Ether",
      _symbol: "ETH",
    },
    L2CrossDomainMessenger: {
      xDomainMsgSender: "0x000000000000000000000000000000000000dEaD",
      l1CrossDomainMessenger: contracts.Proxy__OVM_L1CrossDomainMessenger,
      messageNonce: 100000,
    },
    WETH9: {
      name: "Wrapped Ether",
      symbol: "WETH",
      decimals: 18,
    },
  };

  const dump: any = {};
  for (const [predeployName, predeployAddress] of Object.entries(
    L2ContractAddresses
  )) {
    dump[predeployAddress] = {
      balance: "00",
      storage: {},
    };

    if (predeployName === "OVM_L1BlockNumber") {
      // OVM_L1BlockNumber is a special case where we just inject a specific bytecode string.
      // We do this because it uses the custom L1BLOCKNUMBER opcode (0x4B) which cannot be
      // directly used in Solidity (yet). This bytecode string simply executes the 0x4B opcode
      // and returns the address given by that opcode.
      dump[predeployAddress].code = "0x4B60005260206000F3";
    } else {
      const artifact = await getContractArtifact(predeployName);
      dump[predeployAddress].code = artifact.deployedBytecode;
    }

    // Compute and set the required storage slots for each contract that needs it.
    if (predeployName in variables) {
      const storageLayout = L2ContractStorages[predeployName];
      const slots = computeStorageSlots(
        storageLayout,
        variables[predeployName]
      );
      for (const slot of slots) {
        dump[predeployAddress].storage[slot.key] = slot.val;
      }
    }
  }

  // Grab the commit hash so we can stick it in the genesis file.
  const genesis = {
    commit: Commit,
    config: {
      chainId: params.chainId,
      homesteadBlock: 0,
      eip150Block: 0,
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      berlinBlock: params.hfBerlinBlock,
      clique: {
        period: 0,
        epoch: 30000,
      },
    },
    difficulty: "1",
    gasLimit: params.l2BlockGasLimit.toString(10),
    extradata:
      "0x" +
      "00".repeat(32) +
      remove0x(params.ovmBlockSignerAddress) +
      "00".repeat(65),
    alloc: dump,
  };

  return genesis;
};

export type { GenesisParams };

export { makeGenesisJson };
