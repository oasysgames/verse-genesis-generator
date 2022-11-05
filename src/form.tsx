import { useState, useEffect } from "react";
import {
  LoadingOverlay,
  TextInput,
  Radio,
  Checkbox,
  Button,
  Group,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { ethers } from "ethers";

import "./App.css";
import { ZeroAddress, Networks } from "./consts";
import {
  getBuilder,
  getChainId,
  getNamedContracts,
  NamedContracts,
} from "./hub-layer";
import { GenesisParams, makeGenesisJson } from "./optimism";

type props = {
  onGenerated: (value: { addresses: object; genesis: object }) => void;
};

type FormValues = GenesisParams & {
  network: "mainnet" | "testnet" | "custom";
  rpc: string;
  advanced: boolean;
  builtTx: string;
};

const validateTxHash = (s: string): null | string =>
  /^0x[a-fA-F0-9]{64}$/.test(s) ? null : "Invalid address format.";

const validateAddress = (s: string): null | string =>
  /^0x[a-fA-F0-9]{40}$/.test(s) ? null : "Invalid address format.";

export default function GenesisForm({ onGenerated }: props) {
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<null | NamedContracts>(null);

  const form = useForm<FormValues>({
    initialValues: {
      network: "mainnet",
      rpc: "",
      advanced: false,
      builtTx: "",
      // GenesisParams
      chainId: 0,
      ovmWhitelistOwner: ZeroAddress,
      ovmGasPriceOracleOwner: "",
      ovmFeeWalletAddress: "",
      ovmBlockSignerAddress: "",
      gasPriceOracleL2GasPrice: 1,
      gasPriceOracleL1BaseFee: 1,
      gasPriceOracleOverhead: 2750,
      gasPriceOracleScalar: 1_500_000,
      gasPriceOracleDecimals: 6,
      hfBerlinBlock: 0,
      l2BlockGasLimit: 15_000_000,
    },
    validate: {
      builtTx: (value) => validateTxHash(value),
      ovmWhitelistOwner: (value) => validateAddress(value),
      ovmGasPriceOracleOwner: (value) => validateAddress(value),
      ovmFeeWalletAddress: (value) => validateAddress(value),
      ovmBlockSignerAddress: (value) => validateAddress(value),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (contracts) {
      const genesis = await makeGenesisJson(values, contracts);
      onGenerated({ addresses: contracts, genesis });
    }
  });

  useEffect(() => {
    if (!form.isValid("builtTx")) return;

    const rpc =
      Networks[form.values.network as "mainnet" | "testnet"] || form.values.rpc;
    if (!rpc) return;

    const asyncTask = async () => {
      const provider = new ethers.providers.JsonRpcProvider(rpc);

      let builder = "";
      let chainId = 0;

      // Fetch the verse owner address from the Hub-Layer.
      try {
        builder = await getBuilder(provider, form.values.builtTx);
      } catch (error) {
        form.setFieldError("builtTx", (error as Error).message);
        return;
      }

      // Fetch the verse chain-id from the Hub-Layer.
      try {
        chainId = await getChainId(provider, builder);
      } catch (error) {
        form.setFieldError("chainId", (error as Error).message);
        return;
      }

      // Fetch a list of verse contracts from the Hub-Layer.
      const contracts = await getNamedContracts(provider, chainId);

      setContracts(contracts);
      form.setFieldValue("chainId", chainId);
      form.setFieldValue("contracts", contracts);
      form.setFieldValue("sequencer", contracts.OVM_Sequencer);
      form.setFieldValue("proposer", contracts.OVM_Proposer);
      form.setFieldValue("ovmFeeWalletAddress", builder);
      form.setFieldValue("ovmGasPriceOracleOwner", builder);
      form.setFieldValue("ovmBlockSignerAddress", contracts.OVM_Sequencer);
    };

    (async () => {
      try {
        form.clearErrors();
        setLoading(true);
        await asyncTask();
      } finally {
        setLoading(false);
      }
    })();
  }, [form.values.network, form.values.builtTx]);

  return (
    <Box>
      <LoadingOverlay visible={loading} overlayBlur={1} />

      <form className="form" onSubmit={handleSubmit}>
        <Radio.Group
          withAsterisk
          label="Select Network"
          description="The Hub-Layer that built the verse."
          {...form.getInputProps("network")}
        >
          <Radio value="mainnet" label="Mainnet" />
          <Radio value="testnet" label="Testnet" />
          <Radio value="custom" label="Custom" />
        </Radio.Group>

        {form.values.network === "custom" && (
          <TextInput
            label="Custom RPC"
            placeholder="https://rpc.example.com/"
            {...form.getInputProps("rpc")}
          />
        )}

        <TextInput
          withAsterisk
          label="Transaction Hash"
          description="The transaction hash that built the verse."
          placeholder="0x"
          {...form.getInputProps("builtTx")}
        />

        <Checkbox
          label="Advanced Mode"
          {...form.getInputProps("advanced", { type: "checkbox" })}
        />

        {form.values.advanced && (
          <>
            <TextInput
              withAsterisk
              label="Chain ID"
              placeholder="12345"
              {...form.getInputProps("chainId")}
            />

            <TextInput
              withAsterisk
              label="Sequencer Address"
              placeholder="0x"
              {...form.getInputProps("sequencer")}
            />

            <TextInput
              withAsterisk
              label="Proposer Address"
              placeholder="0x"
              {...form.getInputProps("proposer")}
            />

            <TextInput
              withAsterisk
              label="Whitelist Owner"
              placeholder="0x"
              {...form.getInputProps("ovmWhitelistOwner")}
            />

            <TextInput
              withAsterisk
              label="GasPriceOracle Owner"
              placeholder="0x"
              {...form.getInputProps("ovmGasPriceOracleOwner")}
            />

            <TextInput
              withAsterisk
              label="FeeWallet Address"
              placeholder="0x"
              {...form.getInputProps("ovmFeeWalletAddress")}
            />

            <TextInput
              withAsterisk
              label="BlockSigner Address"
              placeholder="0x"
              {...form.getInputProps("ovmBlockSignerAddress")}
            />

            <TextInput
              withAsterisk
              label="GasPriceOracle L2 GasPrice"
              {...form.getInputProps("gasPriceOracleL2GasPrice")}
            />

            <TextInput
              withAsterisk
              label="GasPriceOracle L1 BaseFee"
              {...form.getInputProps("gasPriceOracleL1BaseFee")}
            />

            <TextInput
              withAsterisk
              label="GasPriceOracle Overhead"
              {...form.getInputProps("gasPriceOracleOverhead")}
            />

            <TextInput
              withAsterisk
              label="GasPriceOracle Scalar"
              {...form.getInputProps("gasPriceOracleScalar")}
            />

            <TextInput
              withAsterisk
              label="GasPriceOracle Decimals"
              {...form.getInputProps("gasPriceOracleDecimals")}
            />

            <TextInput
              withAsterisk
              label="BerlinBlock"
              {...form.getInputProps("hfBerlinBlock")}
            />

            <TextInput
              withAsterisk
              label="L2 Block GasLimit"
              {...form.getInputProps("l2BlockGasLimit")}
            />
          </>
        )}

        <Group position="right" mt="md">
          <Button type="submit" disabled={!form.isValid()}>
            Generate
          </Button>
        </Group>
      </form>
    </Box>
  );
}

export type { FormValues };
