import Head from "next/head";
import * as React from "react";
import { useRouter } from "next/router";
import { IoPersonSharp, IoPeopleSharp } from "react-icons/io5";
import { useEffect, useState } from "react";
import SearchBar from "@/components/SearchBar";

interface BlurCirclesProps {
  top: string;
  left: string;
  right?: string;
  opacity?: number;
  color: string;
}

function BlurCircles({ top, left, right = "0", opacity = 75, color }: BlurCirclesProps) {
  return (
    <div
      className={`overflow-hidden absolute w-[400px] h-[400px] rounded-full blur-[400px] ring-8 ring-blue-300 opacity-${opacity} z-0`}
      style={{ top: `${top}px`, left: `${left}px`, right: `${right}px`, backgroundColor: color }}
    ></div>
  );
}

interface SidebarButtonProps {
  text: string;
  icon: React.ReactNode;
  src: string;
}

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState("");
  const router = useRouter();

  function SidebarButton({ text, icon, src }: SidebarButtonProps) {
    return (
      <button
        onClick={() => {
          router.push(src);
        }}
        className={`
        ${mode === text ? "bg-gradient-to-r from-[#18223b] to-[#403640]" : ""}
        group grid w-full place-items-center 
        hover:bg-gradient-to-r from-[#18223b] to-[#403640]
        rounded-xl hover:scale-110 transition-all`}
      >
        <div className="flex flex-row text-[#8b8ba0] place-items-center text-2xl gap-x-4">
          {icon}
          <h2 className={`${mode === text ? "text-white" : ""} py-3 group-hover:text-white`}>{text}</h2>
        </div>
      </button>
    );
  }

  useEffect(() => {
    if (router.route.startsWith("/singleplayer")) {
      setMode("Singleplayer");
    } else if (router.route.startsWith("/multiplayer")) {
      setMode("Multiplayer");
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>BetterGuessr | {mode}</title>
        <meta name="description" content="GeoGuessr but better" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/marker.png" />
      </Head>

      <div className="bg-[#1b1831] relative h-max w-full overflow-hidden">
        {/* uninteractable and at the very back */}
        <div className="overflow-hidden absolute z-0 w-full h-full pointer-events-none">
          <BlurCircles top="0" left="20" color="#556296" />
          <BlurCircles top="0" right="20" color="#e2c079" opacity={25} left={""} />
          <BlurCircles top="0" right="1000" color="#0e74bf" opacity={50} left={""} />
          <BlurCircles top="2000" right="20" color="#75538f" left={""} />
          <BlurCircles top="4000" left="20" color="#7553ff" />
        </div>
        <div className="flex flex-row min-h-screen z-20">
          <div className="p-8 bg-[#161627] z-20">
            <h1
              className="text-4xl font-bold gradient-outline p-3 rounded-lg tracking-widest mb-12"
              style={{ fontFamily: "Futura" }}
            >
              BETTERGUESSR
            </h1>
            <ul className="flex flex-col gap-y-2">
              <SidebarButton text="Singleplayer" icon={<IoPersonSharp size={32} />} src="/singleplayer" />
              <SidebarButton text="Multiplayer" icon={<IoPeopleSharp size={32} />} src="/multiplayer" />
            </ul>
          </div>
          <div className="flex flex-col w-full h-full">
            <div className="px-12 pt-8">
              <SearchBar></SearchBar>
            </div>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
