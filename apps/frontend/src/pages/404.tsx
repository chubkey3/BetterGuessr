import Head from "next/head";
import * as React from "react";
import { motion } from "framer-motion";
import { IoPersonSharp, IoPeopleSharp } from "react-icons/io5";
import { useState } from "react";

function BlurCircles({ top, left, right = "0", color }: { top: string; left: string; right?: string; color: string }) {
  return (
    <div
      className="overflow-hidden absolute w-[800px] h-[800px] rounded-full blur-[400px] ring-8 ring-blue-300 opacity-75 z-0"
      style={{ top: `${top}px`, left: `${left}px`, right: `${right}px`, backgroundColor: color }}
    ></div>
  );
}

function SidebarButton({ text, icon }: { text: string; icon: React.ReactNode }) {
  return (
    <button className="group grid w-full place-items-center hover:bg-gradient-to-r from-[#18223b] to-[#403640] rounded-xl hover:scale-110 transition-all">
      <div
        className="flex flex-row text-[#8b8ba0] place-items-center text-2xl gap-x-4"
        style={{ fontFamily: "Sequel Sans" }}
      >
        {icon}
        <h2 className="py-3 group-hover:text-white">{text}</h2>
      </div>
    </button>
  );
}

export default function Home() {
  return (
    <>
      <Head>
        <title>BetterGuessr</title>
        <meta name="description" content="GeoGuessr but better" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="refresh" content="0; url=/singleplayer" />
        <link rel="icon" href="/marker.png" />
      </Head>

      <div className="bg-[#1b1831] relative h-max w-full overflow-hidden">
        <div className="overflow-hidden absolute z-0 w-full h-full">
          <BlurCircles top="0" left="20" color="#556296" />
          <BlurCircles top="1000" right="20" color="#75538f" left={""} />
        </div>
      </div>
    </>
  );
}
