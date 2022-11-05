/**
 * @defi-wonderland/smock
 * https://github.com/defi-wonderland/smock/blob/9cffea640c4bd5ddc09a638505f6bb0a0cebdbad/src/utils/storage.ts
 */

import { BigNumber, utils, constants } from "ethers";
import { bigNumberToHex, fromHexString, remove0x } from "./hex-utils";

interface StorageSlotPair {
  key: string;
  val: string;
}

interface SolidityStorageObj {
  astId: number;
  contract: string;
  label: string;
  offset: number;
  slot: string;
  type: string;
}

interface SolidityStorageType {
  encoding: string;
  label: string;
  numberOfBytes: string;
  key?: string;
  value?: string;
  base?: string;
  members?: SolidityStorageObj[];
}

interface SolidityStorageLayout {
  storage: SolidityStorageObj[];
  types: {
    [name: string]: SolidityStorageType;
  };
}

const padNumHexSlotValue = (val: any, offset: number): string => {
  const bn = BigNumber.from(val);

  return (
    "0x" +
    bigNumberToHex(bn)
      .padStart(64 - offset * 2, bn.isNegative() ? "f" : "0") // Pad the start with 64 - offset bytes
      .padEnd(64, "0") // Pad the end (up to 64 bytes) with zero bytes.
      .toLowerCase() // Making this lower case makes assertions more consistent later.
  );
};

const padBytesHexSlotValue = (val: string, offset: number): string => {
  return (
    "0x" +
    remove0x(val)
      .padStart(64 - offset * 2, "0") // Pad the start with 64 - offset zero bytes.
      .padEnd(64, "0") // Pad the end (up to 64 bytes) with zero bytes.
      .toLowerCase() // Making this lower case makes assertions more consistent later.
  );
};

const encodeVariable = (
  variable: any,
  storageObj: SolidityStorageObj,
  storageTypes: {
    [name: string]: SolidityStorageType;
  },
  nestedSlotOffset = 0,
  baseSlotKey?: string
): StorageSlotPair[] => {
  let slotKey: string =
    "0x" +
    remove0x(
      BigNumber.from(baseSlotKey || nestedSlotOffset)
        .add(BigNumber.from(parseInt(storageObj.slot, 10)))
        .toHexString()
    ).padStart(64, "0");

  const variableType = storageTypes[storageObj.type];
  if (variableType.encoding === "inplace") {
    if (
      variableType.label === "address" ||
      variableType.label.startsWith("contract")
    ) {
      if (!utils.isAddress(variable)) {
        throw new Error(`invalid address type: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padBytesHexSlotValue(variable, storageObj.offset),
        },
      ];
    } else if (variableType.label === "bool") {
      // Do some light parsing here to make sure "true" and "false" are recognized.
      if (typeof variable === "string") {
        if (variable === "false") {
          variable = false;
        }
        if (variable === "true") {
          variable = true;
        }
      }

      if (typeof variable !== "boolean") {
        throw new Error(`invalid bool type: ${variable}`);
      }

      return [
        {
          key: slotKey,
          val: padNumHexSlotValue(variable ? "1" : "0", storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith("bytes")) {
      if (
        !utils.isHexString(variable, parseInt(variableType.numberOfBytes, 10))
      ) {
        throw new Error(`invalid bytesN type`);
      }

      return [
        {
          key: slotKey,
          val: padBytesHexSlotValue(
            remove0x(variable).padEnd(
              parseInt(variableType.numberOfBytes, 10) * 2,
              "0"
            ),
            storageObj.offset
          ),
        },
      ];
    } else if (
      variableType.label.startsWith("uint") ||
      variableType.label.startsWith("int")
    ) {
      let valueLength = remove0x(BigNumber.from(variable).toHexString()).length;
      if (variableType.label.startsWith("int")) {
        valueLength = remove0x(
          BigNumber.from(variable).toHexString().slice(1)
        ).length;
      }

      if (valueLength / 2 > parseInt(variableType.numberOfBytes, 10)) {
        throw new Error(
          `provided ${variableType.label} is too big: ${variable}`
        );
      }

      return [
        {
          key: slotKey,
          val: padNumHexSlotValue(variable, storageObj.offset),
        },
      ];
    } else if (variableType.label.startsWith("struct")) {
      // Structs are encoded recursively, as defined by their `members` field.
      let slots: StorageSlotPair[] = [];
      for (const [varName, varVal] of Object.entries(variable)) {
        slots = slots.concat(
          encodeVariable(
            varVal,
            (variableType.members as SolidityStorageObj[]).find((member) => {
              return member.label === varName;
            }) as SolidityStorageObj,
            storageTypes,
            nestedSlotOffset + parseInt(storageObj.slot as any, 10),
            baseSlotKey
          )
        );
      }
      return slots;
    }
  } else if (variableType.encoding === "bytes") {
    if (storageObj.offset !== 0) {
      // string/bytes types are *not* packed by Solidity.
      throw new Error(`got offset for string/bytes type, should never happen`);
    }

    // `string` types are converted to utf8 bytes, `bytes` are left as-is (assuming 0x prefixed).
    const bytes =
      storageObj.type === "string"
        ? utils.toUtf8Bytes(variable)
        : fromHexString(variable);

    // ref: https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#bytes-and-string
    if (bytes.length < 32) {
      // NOTE: Solidity docs (see above) specifies that strings or bytes with a length of 31 bytes
      // should be placed into a storage slot where the last byte of the storage slot is the length
      // of the variable in bytes * 2.
      return [
        {
          key: slotKey,
          val: utils.hexlify(
            utils.concat([
              utils.concat([bytes, constants.HashZero]).slice(0, 31),
              BigNumber.from(bytes.length * 2).toHexString(),
            ])
          ),
        },
      ];
    } else {
      let slots: StorageSlotPair[] = [];
      // According to the solidity docs (https://docs.soliditylang.org/en/v0.8.4/internals/layout_in_storage.html#bytes-and-string)
      // For bytes or strings that store data which is 32 or more bytes long, the main slot p stores length * 2 + 1
      // and the data is stored as usual in keccak256(p)
      slots = slots.concat({
        key: slotKey,
        val: padNumHexSlotValue(bytes.length * 2 + 1, 0),
      });

      // Each storage slot has 32 bytes so we make sure to slice the large bytes into 32bytes chunks
      for (let i = 0; i * 32 < bytes.length; i++) {
        // We calculate the Storage Slot key based on the solidity docs (see above link)
        let key = BigNumber.from(utils.keccak256(slotKey))
          .add(BigNumber.from(i.toString(16)))
          .toHexString();
        slots = slots.concat({
          key: key,
          val: utils.hexlify(
            utils
              .concat([bytes.slice(i * 32, i * 32 + 32), constants.HashZero])
              .slice(0, 32)
          ),
        });
      }

      return slots;
    }
  } else if (variableType.encoding === "mapping") {
    if (variableType.key === undefined || variableType.value === undefined) {
      // Should never happen in practice but required to maintain proper typing.
      throw new Error(
        `variable is a mapping but has no key field or has no value field: ${variableType}`
      );
    }

    let slots: StorageSlotPair[] = [];
    for (const [varName, varVal] of Object.entries(variable)) {
      // Mapping keys are encoded depending on the key type.
      let key: string;
      if (variableType.key.startsWith("t_uint")) {
        key = padNumHexSlotValue(BigNumber.from(varName).toHexString(), 0);
      } else if (variableType.key.startsWith("t_bytes")) {
        key = padBytesHexSlotValue("0x" + remove0x(varName).padEnd(64, "0"), 0);
      } else {
        // Seems to work for everything else.
        key = padBytesHexSlotValue(varName, 0);
      }

      // Figure out the base slot key that the mapped values need to work off of.
      // If baseSlotKey is defined here, then we're inside of a nested mapping and we should work
      // off of that previous baseSlotKey. Otherwise the base slot will be the slot of this map.
      const prevBaseSlotKey =
        baseSlotKey || padNumHexSlotValue(storageObj.slot, 0);
      const nextBaseSlotKey = utils.keccak256(key + remove0x(prevBaseSlotKey));

      // Encode the value. We need to use a dummy storageObj here because the function expects it.
      // Of course, we're not mapping to a specific variable. We map to a variable /type/. So we
      // need a dummy thing to represent a variable of that type.
      slots = slots.concat(
        encodeVariable(
          varVal,
          {
            label: varName,
            offset: 0,
            slot: "0",
            type: variableType.value,
            astId: 0,
            contract: "",
          },
          storageTypes,
          nestedSlotOffset + parseInt(storageObj.slot, 10),
          nextBaseSlotKey
        )
      );
    }
    return slots;
  } else if (variableType.encoding === "dynamic_array") {
    if (variableType.base === undefined) {
      // Should never happen in practice but required to maintain proper typing.
      throw new Error(`variable is an array but has no base: ${variableType}`);
    }
    // In slotKey we save the length of the array
    let slots: StorageSlotPair[] = [
      {
        key: slotKey,
        val: padNumHexSlotValue(variable.length, 0),
      },
    ];

    let numberOfBytes: number = 0;
    let nextBaseSlotKey = BigNumber.from(utils.keccak256(slotKey));

    // We need to find the number of bytes the base type has.
    // The `numberOfBytes` variable will help us deal with packed arrays.
    // We should only care for packed values only if the `numberOfBytes` is less than 16 otherwise there is no packing.
    if (variableType.base.startsWith("t_bool")) {
      numberOfBytes = 1;
    } else if (
      variableType.base.startsWith("t_uint") ||
      variableType.base.startsWith("t_int")
    ) {
      // We find the number of bits from the base and divide it with 8 to get the number of bytes
      numberOfBytes = Number(variableType.base.replace(/\D/g, "")) / 8;
      // If we have more than 16Bytes for each value then we don't care about packed variables.
      /* eslint @typescript-eslint/no-unused-expressions: "off" */
      numberOfBytes > 16 ? 0 : numberOfBytes;
    }

    let offset: number = -numberOfBytes;
    for (let i = 0; i < variable.length; i++) {
      // If the values are packed then we need to keep track of the offset and when to change slot
      if (numberOfBytes > 0) {
        offset += numberOfBytes;
        if (offset >= 32) {
          offset = 0;
          nextBaseSlotKey = nextBaseSlotKey.add(BigNumber.from(1));
        }
      } else {
        offset = 0;
        nextBaseSlotKey = BigNumber.from(utils.keccak256(slotKey)).add(
          BigNumber.from(i.toString(16))
        );
      }

      slots = slots.concat(
        encodeVariable(
          variable[i],
          {
            label: "",
            offset: offset,
            slot: "0",
            type: variableType.base,
            astId: 0,
            contract: "",
          },
          storageTypes,
          nestedSlotOffset,
          nextBaseSlotKey.toHexString()
        )
      );
    }
    return slots;
  }

  throw new Error(
    `unknown unsupported type ${variableType.encoding} ${variableType.label}`
  );
};

const computeStorageSlots = (
  storageLayout: SolidityStorageLayout,
  variables: any = {}
): Array<StorageSlotPair> => {
  let slots: StorageSlotPair[] = [];
  for (const [variableName, variableValue] of Object.entries(variables)) {
    // Find the entry in the storage layout that corresponds to this variable name.
    const storageObj = storageLayout.storage.find((entry) => {
      return entry.label === variableName;
    });

    // Complain very loudly if attempting to set a variable that doesn't exist within this layout.
    if (!storageObj) {
      throw new Error(
        `Variable name not found in storage layout: ${variableName}`
      );
    }

    // Encode this variable as series of storage slot key/value pairs and save it.
    slots = slots.concat(
      encodeVariable(variableValue, storageObj, storageLayout.types)
    );
  }

  // Dealing with packed storage slots now. We know that a storage slot is packed when two storage
  // slots produced by the above encoding have the same key. In this case, we want to merge the two
  // values into a single bytes32 value. We'll throw an error if the two values overlap (have some
  // byte where both values are non-zero).
  slots = slots.reduce((prevSlots: StorageSlotPair[], slot) => {
    // Find some previous slot where we have the same key.
    const prevSlot = prevSlots.find((otherSlot) => {
      return otherSlot.key === slot.key;
    });

    if (prevSlot === undefined) {
      // Slot doesn't share a key with any other slot so we can just push it and continue.
      prevSlots.push(slot);
    } else {
      // Slot shares a key with some previous slot.
      // First, we remove the previous slot from the list of slots since we'll be modifying it.
      prevSlots = prevSlots.filter((otherSlot) => {
        return otherSlot.key !== prevSlot.key;
      });

      // Now we'll generate a merged value by taking the non-zero bytes from both values. There's
      // probably a more efficient way to do this, but this is relatively easy and straightforward.
      let mergedVal = "0x";
      const valA = remove0x(slot.val);
      const valB = remove0x(prevSlot.val);
      for (let i = 0; i < 64; i += 2) {
        const byteA = valA.slice(i, i + 2);
        const byteB = valB.slice(i, i + 2);

        if (byteA === "00" && byteB === "00") {
          mergedVal += "00";
        } else if (byteA === "00" && byteB !== "00") {
          mergedVal += byteB;
        } else if (byteA !== "00" && byteB === "00") {
          mergedVal += byteA;
        } else if (byteA === "ff" && byteB === "ff") {
          mergedVal += "ff";
        } else if (byteA === "ff" && byteB !== "00") {
          mergedVal += byteB;
        } else if (byteA !== "00" && byteB === "ff") {
          mergedVal += byteA;
        } else {
          // Should never happen, means our encoding is broken. Values should *never* overlap.
          throw new Error(
            "detected badly encoded packed value, should not happen"
          );
        }
      }

      prevSlots.push({
        key: slot.key,
        val: mergedVal,
      });
    }

    return prevSlots;
  }, []);

  return slots;
};

export {
  padNumHexSlotValue,
  padBytesHexSlotValue,
  encodeVariable,
  computeStorageSlots,
};
