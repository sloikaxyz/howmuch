import { useQuery } from "@tanstack/react-query";
import { FixedNumber } from "ethers";
import Head from "next/head";
import { useCallback, useMemo, useState, type ChangeEventHandler } from "react";
import invariant from "tiny-invariant";
import { z } from "zod";

import { env } from "~/env.mjs";

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

const DUNE_GAS_QUERY_SCHEMA = z.object({
  result: z.object({
    rows: z
      .array(
        z.object({
          p50_gas_price: z.number(),
        })
      )
      .min(1)
      .max(1),
  }),
});

const TX_GAS_BASE = BigInt(506061);
const TX_GAS_PER_PHOTO = BigInt(25687);

export default function Home() {
  const { data: gasPriceGwei } = useQuery({
    queryKey: [env.NEXT_PUBLIC_DUNE_GAS_QUERY_API_URL] as const,
    queryFn: async ({ queryKey: [endpoint] }) => {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(
          `failed to fetch gas prices: ${response.status} ${response.statusText}`
        );
      }

      const responseJSON = await response.json();
      const data = DUNE_GAS_QUERY_SCHEMA.parse(responseJSON);
      const [gasPriceResultRow] = data.result.rows;
      invariant(typeof gasPriceResultRow !== "undefined");

      return BigInt(gasPriceResultRow.p50_gas_price);
    },
  });

  const [quantity, setQuantity] = useState(100);

  const txGas = useMemo(
    () => TX_GAS_BASE + TX_GAS_PER_PHOTO * BigInt(quantity),
    [quantity]
  );

  const txGasCostGwei = useMemo(
    () =>
      typeof gasPriceGwei !== "undefined" ? txGas * gasPriceGwei : undefined,
    [txGas, gasPriceGwei]
  );

  const txGasCostEthRounded = useMemo(
    () =>
      typeof txGasCostGwei !== "undefined"
        ? FixedNumber.fromValue(txGasCostGwei, 9, { decimals: 9 }).round(5)
        : undefined,
    [txGasCostGwei]
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
              {typeof gasPriceGwei !== "undefined" ? (
                <span
                  className="underline decoration-gray-300 decoration-dotted"
                  title={`${gasPriceGwei.toString()} gwei is the median gas price over the last week`}
                >
                  {gasPriceGwei.toString()} gwei per gas
                </span>
              ) : (
                "… gwei per gas"
              )}
            </span>
          </p>
        </div>
      </main>
    </>
  );
}
