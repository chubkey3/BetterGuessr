import Head from "next/head";
import { useEffect } from "react";

export default function Home() {

  useEffect(() => {

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
    </>
  );
}
