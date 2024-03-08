import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/button";
import { ALGEBRA_POSITION_MANAGER } from "@/constants/addresses";
import { DEFAULT_CHAIN_ID } from "@/constants/default-chain-id";
import { usePrepareAlgebraPositionManagerMulticall } from "@/generated";
import { useApprove } from "@/hooks/common/useApprove";
import { useTransitionAwait } from "@/hooks/common/useTransactionAwait";
import { IDerivedMintInfo } from "@/state/mintStore";
import { useUserState } from "@/state/userStore";
import { ApprovalState } from "@/types/approve-state";
import { Percent, Currency, NonfungiblePositionManager, Field } from "@cryptoalgebra/integral-sdk";
import { useWeb3Modal, useWeb3ModalState } from "@web3modal/wagmi/react";
import { useMemo } from "react";
import { Address, useAccount, useContractWrite } from "wagmi";

interface AddLiquidityButtonProps {
  baseCurrency: Currency | undefined | null;
  quoteCurrency: Currency | undefined | null;
  mintInfo: IDerivedMintInfo;
  poolAddress: Address | undefined
}

const ZERO_PERCENT = new Percent('0');
const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000);

export const AddLiquidityButton = ({ baseCurrency, quoteCurrency, mintInfo, poolAddress }: AddLiquidityButtonProps) => {

  const { address: account } = useAccount();

  const { open } = useWeb3Modal()

  const { selectedNetworkId } = useWeb3ModalState()

  const { txDeadline } = useUserState();

  const useNative = baseCurrency?.isNative
    ? baseCurrency
    : quoteCurrency?.isNative
      ? quoteCurrency
      : undefined;

  const { calldata, value } = useMemo(() => {
    if (!mintInfo.position || !account)
      return { calldata: undefined, value: undefined };

    return NonfungiblePositionManager.addCallParameters(mintInfo.position, {
      slippageTolerance: mintInfo.outOfRange
        ? ZERO_PERCENT
        : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE,
      recipient: account,
      deadline: Date.now() + txDeadline,
      useNative,
      createPool: mintInfo.noLiquidity,
    });
  }, [mintInfo, account]);


  const { approvalState: approvalStateA, approvalCallback: approvalCallbackA } = useApprove(mintInfo.parsedAmounts[Field.CURRENCY_A], ALGEBRA_POSITION_MANAGER);
  const { approvalState: approvalStateB, approvalCallback: approvalCallbackB } = useApprove(mintInfo.parsedAmounts[Field.CURRENCY_B], ALGEBRA_POSITION_MANAGER);

  const isReady = useMemo(() => {
    return Boolean(
      (mintInfo.depositADisabled ? true : approvalStateA === ApprovalState.APPROVED) &&
      (mintInfo.depositBDisabled ? true : approvalStateB === ApprovalState.APPROVED) &&
      !mintInfo.errorMessage &&
      !mintInfo.invalidRange
    );
  }, [mintInfo, approvalStateA, approvalStateB]);

  const { config: addLiquidityConfig } = usePrepareAlgebraPositionManagerMulticall({
    args: calldata && [calldata as `0x${string}`[]],
    enabled: Boolean(calldata && isReady),
    value: BigInt(value || 0),
  });

  const { data: addLiquidityData, write: addLiquidity } = useContractWrite(addLiquidityConfig)

  const { isLoading: isAddingLiquidityLoading } = useTransitionAwait(addLiquidityData?.hash, 'Add liquidity', '', `/pool/${poolAddress}`)

  const isWrongChain = Number(selectedNetworkId) !== DEFAULT_CHAIN_ID

  if (!account) return <Button onClick={() => open()}>Connect Wallet</Button>

  if (isWrongChain) return <Button variant={'destructive'} onClick={() => open({ view: 'Networks' })}>Connect to Berachain</Button>

  if ((approvalStateA === ApprovalState.NOT_APPROVED || approvalStateA === ApprovalState.PENDING || approvalStateB === ApprovalState.NOT_APPROVED || approvalStateB === ApprovalState.PENDING)) return <div className="flex w-full gap-2">
    {(approvalStateA === ApprovalState.NOT_APPROVED || approvalStateA === ApprovalState.PENDING) && <Button disabled={approvalStateA === ApprovalState.PENDING} className="w-full" onClick={() => approvalCallbackA && approvalCallbackA()}>{approvalStateA === ApprovalState.PENDING ? <Loader /> : `Approve ${mintInfo.currencies.CURRENCY_A?.symbol}`}</Button>}
    {(approvalStateB === ApprovalState.NOT_APPROVED || approvalStateB === ApprovalState.PENDING) && <Button disabled={approvalStateB === ApprovalState.PENDING} className="w-full" onClick={() => approvalCallbackB && approvalCallbackB()}>{approvalStateB === ApprovalState.PENDING ? <Loader /> : `Approve ${mintInfo.currencies.CURRENCY_B?.symbol}`}</Button>}
  </div>

  if (mintInfo.errorMessage) return <Button disabled>{mintInfo.errorMessage}</Button>

  return <Button disabled={!isReady} onClick={() => addLiquidity && addLiquidity()}>
    {isAddingLiquidityLoading ? <Loader /> : 'Create Position'}
  </Button>
};

export default AddLiquidityButton;
