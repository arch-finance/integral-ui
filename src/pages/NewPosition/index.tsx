import PageContainer from "@/components/common/PageContainer"
import PageTitle from "@/components/common/PageTitle"
import EnterAmounts from "@/components/create-position/EnterAmounts"
import LiquidityChart from "@/components/create-position/LiquidityChart"
import RangeSelector from "@/components/create-position/RangeSelector"
import PresetTabs from "@/components/create-position/PresetTabs"
import TokenRatio from "@/components/create-position/TokenRatio"
import AddLiquidityButton from "@/components/create-position/AddLiquidityButton"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useAlgebraPoolToken0, useAlgebraPoolToken1 } from "@/generated"
import { useCurrency } from "@/hooks/common/useCurrency"
import { useDerivedMintInfo, useMintActionHandlers, useMintState, useRangeHopCallbacks } from "@/state/mintStore"
import { Bound, INITIAL_POOL_FEE } from "@cryptoalgebra/integral-sdk"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { Address } from "wagmi"
import { usePositionAPR } from "@/hooks/positions/usePositionAPR"
import { getPoolAPR } from "@/utils/pool/getPoolAPR"

type NewPositionPageParams = Record<'pool', Address>

const NewPositionPage = () => {

    const { pool: poolAddress } = useParams<NewPositionPageParams>()

    const [poolAPR, setPoolAPR] = useState<number>()

    const { data: token0 } = useAlgebraPoolToken0({
        address: poolAddress
    })

    const { data: token1 } = useAlgebraPoolToken1({
        address: poolAddress
    })

    const currencyA = useCurrency(token0)
    const currencyB = useCurrency(token1)

    const mintInfo = useDerivedMintInfo(
        currencyA ?? undefined,
        currencyB ?? undefined,
        poolAddress,
        INITIAL_POOL_FEE,
        currencyA ?? undefined,
        undefined
    );

    const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = mintInfo.pricesAtTicks

    const price = useMemo(() => {
        if (!mintInfo.price) return

        return mintInfo.invertPrice ? mintInfo.price.invert().toSignificant(5) : mintInfo.price.toSignificant(5)
    }, [mintInfo])

    const currentPrice = useMemo(() => {
        if (!mintInfo.price) return;

        if (Number(price) <= 0.0001) {
            return `< 0.0001 ${currencyB?.symbol}`;
        } else {
            return `${price} ${currencyB?.symbol}`;
        }
    }, [mintInfo.price, price]);


    const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = useMemo(() => {
        return mintInfo.ticks;
    }, [mintInfo]);

    const {
        getDecrementLower,
        getIncrementLower,
        getDecrementUpper,
        getIncrementUpper,
    } = useRangeHopCallbacks(
        currencyA ?? undefined,
        currencyB ?? undefined,
        mintInfo.tickSpacing,
        tickLower,
        tickUpper,
        mintInfo.pool
    );

    const {
        onLeftRangeInput,
        onRightRangeInput,
    } = useMintActionHandlers(mintInfo.noLiquidity);

    const {
        startPriceTypedValue,
    } = useMintState();

    const apr = usePositionAPR(poolAddress, mintInfo.position)

    useEffect(() => {
        if (!poolAddress) return
        getPoolAPR(poolAddress).then(setPoolAPR)
    }, [poolAddress])


    useEffect(() => {
        return () => {
            onLeftRangeInput('')
            onRightRangeInput('')
        }
    }, [])

    return <PageContainer>

        <PageTitle title={'Create Position'} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-0 gap-y-8 w-full lg:gap-8 mt-8 lg:mt-16 text-left">

            <div className="col-span-2">

                <div className="flex items-center justify-between w-full mb-6">
                    <h2 className="font-semibold text-2xl text-left">1. Select Range</h2>
                    <PresetTabs
                        currencyA={currencyA}
                        currencyB={currencyB}
                        mintInfo={mintInfo}
                    />
                </div>

                <div className="flex flex-col w-full">

                    <div className="w-full px-8 py-6 bg-card text-left rounded-3xl border border-card-border">

                        <div className="flex w-full flex-col md:flex-row gap-4">
                            <RangeSelector
                                priceLower={priceLower}
                                priceUpper={priceUpper}
                                getDecrementLower={getDecrementLower}
                                getIncrementLower={getIncrementLower}
                                getDecrementUpper={getDecrementUpper}
                                getIncrementUpper={getIncrementUpper}
                                onLeftRangeInput={onLeftRangeInput}
                                onRightRangeInput={onRightRangeInput}
                                currencyA={currencyA}
                                currencyB={currencyB}
                                mintInfo={mintInfo}
                                disabled={!startPriceTypedValue && !mintInfo.price}
                            />
                            <div className="md:ml-auto md:text-right">
                                <div className="font-bold text-xs mb-3">CURRENT PRICE</div>
                                <div className="font-bold text-xl">{`${currentPrice}`}</div>
                            </div>
                        </div>

                        <LiquidityChart 
                            currencyA={currencyA} 
                            currencyB={currencyB} 
                            currentPrice={price ? parseFloat(price) : undefined}
                            priceLower={priceLower}
                            priceUpper={priceUpper} />

                    </div>

                </div>

            </div>

            <div className="flex flex-col">

                <h2 className="font-semibold text-2xl text-left mb-6 leading-[44px]">2. Enter Amounts</h2>

                <div className="flex flex-col w-full h-full gap-2 bg-card border border-card-border rounded-3xl p-2">

                    <EnterAmounts currencyA={currencyA} currencyB={currencyB} mintInfo={mintInfo} />

                    <HoverCard>
                        <HoverCardTrigger>
                            <TokenRatio mintInfo={mintInfo} />
                        </HoverCardTrigger>
                        <HoverCardContent className="flex flex-col gap-2 bg-card rounded-3xl border border-card-border text-white w-fit">
                            <div className="flex items-center">
                                <span className="font-bold">Token Ratio</span>
                            </div>
                        </HoverCardContent>
                    </HoverCard>

                    <div className="flex justify-between bg-card-dark p-2 px-3 rounded-xl">
                        <div>
                            <div className="text-xs font-bold">ESTIMATED POSITION APR</div>
                            <div className="text-lg font-bold text-green-300">{apr ? `${apr.toFixed(2)}%` : 0}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold">POOL APR</div>
                            <div className="text-lg font-bold text-cyan-300">{poolAPR !== undefined ? `${poolAPR}%` : null}</div>
                        </div>
                    </div>

                    <AddLiquidityButton baseCurrency={currencyA} quoteCurrency={currencyB} mintInfo={mintInfo} />

                </div>

            </div>

        </div>

    </PageContainer>

}

export default NewPositionPage