import { useQuery } from "@tanstack/react-query";
import { FixedNumber, formatUnits, parseUnits } from "ethers";
import Head from "next/head";
import { useCallback, useMemo, useState, type ChangeEventHandler } from "react";
import { z } from "zod";

function QuantityForm({
  initialQuantity,
  onQuantityChange,
}: {
  initialQuantity: number;
  onQuantityChange: (qty: number) => void;
}) {
  const handleQuantityChange = useCallback<ChangeEventHandler<HTMLSpanElement>>(
    (event) => {
      const parsedValue = parseInt(event.target.innerText, 10);
      onQuantityChange(
        Number.isInteger(parsedValue) && Number.isFinite(parsedValue)
          ? parsedValue
          : 0
      );
    },
    [onQuantityChange]
  );

  return (
    <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        How much does it cost to mint
      </h1>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        <span
          contentEditable
          suppressContentEditableWarning
          onInput={handleQuantityChange}
          className="underline decoration-gray-200 decoration-dashed decoration-4 underline-offset-8"
        >
          {initialQuantity}
        </span>
        {"  "}
        photos
      </h1>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        on{"  "}
        <a href="https://sloika.xyz">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src="https://sloika.xyz/sloika-white-logo.png"
            className="ml-2 mr-0.5 inline h-6 w-6"
          />
          sloika.xyz?
        </a>
      </h1>
    </div>
  );
}

const GASPRICEIO_HISTORY_ENDPOINT = "https://api.gasprice.io/v1/historyByHour";

const GASPRICEIO_ESTIMATE_SCHEMA = z.object({
  feeCap: z.number(),
  maxPriorityFee: z.number(),
});

const GASPRICEIO_HISTORY_SCHEMA = z
  .object({
    error: z.null(),
    result: z.array(
      z.object({
        timestamp: z.number(),
        estimates: z.object({
          instant: GASPRICEIO_ESTIMATE_SCHEMA,
          fast: GASPRICEIO_ESTIMATE_SCHEMA,
          eco: GASPRICEIO_ESTIMATE_SCHEMA,
          baseFee: z.number(),
        }),
      })
    ),
  })
  .or(
    z.object({
      error: z.string(),
    })
  );

/**
 * Gets gas price history from gasprice.io
 * @param param0.duration - duration in seconds
 */
function useGasPriceHistory({ duration }: { duration: number }) {
  return useQuery({
    queryKey: [
      GASPRICEIO_HISTORY_ENDPOINT,
      { duration: duration.toString() },
    ] as const,
    queryFn: async ({ queryKey: [endpoint, query] }) => {
      const response = await fetch(
        `${endpoint}?${new URLSearchParams(query).toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `failed to fetch gas prices: ${response.status} ${response.statusText}`
        );
      }

      const responseJSON = GASPRICEIO_HISTORY_SCHEMA.parse(
        await response.json()
      );

      if (typeof responseJSON.error === "string") {
        throw new Error(responseJSON.error);
      }

      return responseJSON.result;
    },
  });
}

const TX_GAS_BASE = BigInt(506061);
const TX_GAS_PER_PHOTO = BigInt(25687);

export default function Home() {
  const { data: gasPriceHistory } = useGasPriceHistory({ duration: 86400 * 7 });
  const averageEcoFeeCapWei = useMemo(
    () =>
      Array.isArray(gasPriceHistory)
        ? gasPriceHistory.reduce(
            (acc, curr) =>
              acc + parseUnits(curr.estimates.eco.feeCap.toFixed(9), "gwei"),
            BigInt(0)
          ) / BigInt(gasPriceHistory.length)
        : undefined,
    [gasPriceHistory]
  );

  const [quantity, setQuantity] = useState(100);

  const txGas = useMemo(
    () => TX_GAS_BASE + TX_GAS_PER_PHOTO * BigInt(quantity),
    [quantity]
  );

  const txGasCostWei = useMemo(
    () =>
      typeof averageEcoFeeCapWei !== "undefined"
        ? txGas * averageEcoFeeCapWei
        : undefined,
    [txGas, averageEcoFeeCapWei]
  );

  const txGasCostEthRounded = useMemo(
    () =>
      typeof txGasCostWei !== "undefined"
        ? FixedNumber.fromValue(txGasCostWei, 18, { decimals: 18 }).round(5)
        : undefined,
    [txGasCostWei]
  );

  return (
    <>
      <Head>
        <title>How much does it cost to mint on Sloika.xyz?</title>
        <link rel="icon" href="https://sloika.xyz/sloika-white-logo.png" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <QuantityForm initialQuantity={100} onQuantityChange={setQuantity} />
        <div className="container flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {typeof txGasCostEthRounded !== "undefined"
              ? `${txGasCostEthRounded.toString()} ETH`
              : "… ETH"}
          </h1>
          <p className="whitespace-nowrap text-gray-400">
            <span>
              ({quantity} &times; {TX_GAS_PER_PHOTO.toString()} +{" "}
              {TX_GAS_BASE.toString()}) tx gas{" "}
            </span>
            <wbr />
            <span>
              &times;{" "}
              {typeof averageEcoFeeCapWei !== "undefined"
                ? `${formatUnits(averageEcoFeeCapWei, "gwei")} gwei per gas`
                : "… gwei per gas"}
            </span>
          </p>
        </div>
      </main>
    </>
  );
}
