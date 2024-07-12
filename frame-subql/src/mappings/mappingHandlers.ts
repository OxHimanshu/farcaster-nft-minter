import { Minter } from "../types";
import {
  MintedLog,
} from "../types/abi-interfaces/Erc20Abi";
import assert from "assert";

export async function handleLog(log: MintedLog): Promise<void> {
  logger.info(`New Mint txn log at block ${log.blockNumber}`);
  assert(log.args, "No log.args");

  const minter = Minter.create({
    id: log.args.tokenId.toString(),
    user: log.args.user,
    tokenURI: log.args.tokenURI,
  });

  await minter.save();
}
