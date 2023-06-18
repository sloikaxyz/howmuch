import clsx from "clsx";
import { Html, Head, Main, NextScript } from "next/document";

import { env } from "~/env.mjs";

export default function Document() {
  return (
    <Html lang="en" className="min-h-screen">
      <Head />
      <body
        className={clsx(
          "min-h-screen",
          env.NODE_ENV === "development" && "debug-screens"
        )}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
