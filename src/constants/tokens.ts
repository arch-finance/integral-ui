import { Token } from "@cryptoalgebra/sdk";
import { DEFAULT_CHAIN_ID } from "./default-chain-id";

export const STABLECOINS = {
  USDT: new Token(
    DEFAULT_CHAIN_ID,
    "0xD8D878Cbb4168B791d0EF57Da540d4FbAaF2Db41",
    18,
    "USDT",
    "USDT"
  ),
};
