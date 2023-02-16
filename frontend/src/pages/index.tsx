import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";

import styles from "@/styles/Home.module.css";
import { useState } from "react";
import Data from "./data.json";
import StreetView from "./StreetView";
import Test from "./GuessMap";
import FullscreenMap from "./FullscreenMap";
import { io } from 'socket.io-client'

const socket = io('http://localhost:3002')

export default function Home() {
  const [center, setCenter] = useState(
    Data[Math.floor(Math.random() * Data.length)]
  );

  const [markers, setMarkers] = useState([])

  return (
    <>
      <Head>
        <title>BetterGuessr</title>
        <meta name="description" content="GeoGuessr but better" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/marker.png" />
      </Head>
      <div className="main-wrapper" style={styles}>
        <StreetView center={center} />
        <Test center={center} setParentMarkers={setMarkers} />
        {markers.length > 0 && <FullscreenMap markers={markers} />}
      </div>
    </>
  );
}
