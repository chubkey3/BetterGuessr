import DashboardWrapper from "@/components/DashboardWrapper";
import countrylist from "@/components/data/countrylist.json";
import { useRouter } from "next/router";

export default function Singleplayer() {
  const router = useRouter();
  function MapButton({ country }: { country: string }) {
    return (
      <button
        onClick={() => router.push(`/singleplayer/${country.replaceAll(" ", "_")}`)}
        className="relative grid place-items-center w-full h-[300px] border-2 border-[#3c35654d] hover:border-[#c6c4d794] rounded-3xl 
        overflow-hidden shadow-2xl shadow-[#00000061] hover:scale-105  transition-all duration-300"
      >
        <div
          className="absolute left-0 top-0 w-full h-full"
          style={{
            backgroundImage: `url(/countries/${country.replaceAll(" ", "_")}.jpg)`,
            backgroundPosition: "center center",
            backgroundSize: "cover",
          }}
        ></div>
        <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-b from-[#ffffff2f] from-30%  via-[#08032765] from-60% to-[#000000de]"></div>
        <div className="absolute left-0 top-0 w-full h-full grid grid-rows-3">
          <div className="row-span-2" />
          <div className="row-span-1 grid place-items-center text-white text-3xl">
            <h1>{country}</h1>
          </div>
        </div>
      </button>
    );
  }

  return (
    <DashboardWrapper>
      <div className="grid place-items-center p-8">
        <h1 className="text-3xl text-white font-semibold mb-8 text-left w-full px-4">Official</h1>
        <div className="grid grid-cols-3 gap-8 w-full max-w-[1400px]">
          {countrylist.map((country, index) => {
            return (
              <div key={index}>
                <MapButton country={country} />
              </div>
            );
          })}
        </div>
      </div>
    </DashboardWrapper>
  );
}
