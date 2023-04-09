import Head from "next/head";
import * as React from "react";

export default function Home() {
  return (
    <>
      <Head>
        <title>BetterGuessr</title>
        <meta name="description" content="GeoGuessr but better" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="refresh" content="0; url=/singleplayer" />
        <link rel="icon" href="/marker.png" />
      </Head>
    </>
  );
}
