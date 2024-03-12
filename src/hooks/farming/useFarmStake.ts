import { FARMING_CENTER } from '@/constants/addresses';
import { farmingCenterABI } from '@/generated';
import { Address, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { useTransitionAwait } from '../common/useTransactionAwait';
import { encodeFunctionData } from 'viem';
import { MaxUint128 } from '@cryptoalgebra/integral-sdk';
import { useEffect } from 'react';
import { refetchDepositsQuery } from '@/graphql/utils/refetchDepositsQuery';

export function useFarmStake({
    tokenId,
    rewardToken,
    bonusRewardToken,
    pool,
    nonce,
}: {
    tokenId: bigint;
    rewardToken: Address;
    bonusRewardToken: Address;
    pool: Address;
    nonce: bigint;
}) {
    const { config } = usePrepareContractWrite({
        address: tokenId ? FARMING_CENTER : undefined,
        abi: farmingCenterABI,
        functionName: 'enterFarming',
        args: [
            {
                rewardToken,
                bonusRewardToken,
                pool,
                nonce,
            },
            tokenId,
        ],
    });

    const { data: data, writeAsync: onStake } = useContractWrite(config);

    const { isLoading, isSuccess } = useTransitionAwait(
        data?.hash,
        `Stake Position #${tokenId}`
    );

    useEffect(() => {
        if (isSuccess) {
            refetchDepositsQuery();
        }
    }, [isSuccess]);

    return {
        isLoading,
        isSuccess,
        onStake,
    };
}

export function useFarmUnstake({
    tokenId,
    rewardToken,
    bonusRewardToken,
    pool,
    nonce,
    account,
}: {
    tokenId: bigint;
    rewardToken: Address;
    bonusRewardToken: Address;
    pool: Address;
    nonce: bigint;
    account: Address;
}) {
    const exitFarmingCalldata = encodeFunctionData({
        abi: farmingCenterABI,
        functionName: 'exitFarming',
        args: [
            {
                rewardToken,
                bonusRewardToken,
                pool,
                nonce,
            },
            tokenId,
        ],
    });

    const rewardClaimCalldata = encodeFunctionData({
        abi: farmingCenterABI,
        functionName: 'claimReward',
        args: [rewardToken, account, BigInt(MaxUint128)],
    });

    const bonusRewardClaimCalldata = encodeFunctionData({
        abi: farmingCenterABI,
        functionName: 'claimReward',
        args: [bonusRewardToken, account, BigInt(MaxUint128)],
    });

    const calldatas = [
        exitFarmingCalldata,
        rewardClaimCalldata,
        bonusRewardClaimCalldata,
    ];

    const { config } = usePrepareContractWrite({
        address: account && tokenId ? FARMING_CENTER : undefined,
        abi: farmingCenterABI,
        functionName: 'multicall',
        args: [calldatas],
    });

    const { data: data, writeAsync: onUnstake } = useContractWrite(config);

    const { isLoading, isSuccess } = useTransitionAwait(
        data?.hash,
        `Unstake Position #${tokenId}`
    );

    useEffect(() => {
        if (isSuccess) {
            refetchDepositsQuery();
        }
    }, [isSuccess]);

    return {
        isLoading,
        isSuccess,
        onUnstake,
    };
}
