import Head from "next/head";
import { useLayoutEffect } from "react";

export default function Home() {

useLayoutEffect(() => {

window.location.href = "/room/abc"

}, [])

  return (
    <>
      <Head>
        <title>BetterGuessr</title>
        <meta name="description" content="GeoGuessr but better" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/marker.png" />
      </Head>
      <h1>BetterGuessr</h1>
      <h2>Go to /room/abc to play!</h2>
    </>
  );
}
