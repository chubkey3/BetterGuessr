import DashboardWrapper from "@/components/DashboardWrapper";
import countrylist from "@/components/data/countrylist.json";

function MapButton({ country }: { country: string }) {
  return (
    <div className="relative grid place-items-center w-full h-[300px]">
      <div
        className="absolute left-0 top-0 w-full h-full overflow-hidden"
        style={{
          backgroundImage: `url(/countries/${country.replaceAll(" ", "_")}.jpg)`,
          backgroundPosition: "center center",
          backgroundSize: "cover",
        }}
      ></div>
      <div className="absolute left-0 top-0 w-full h-full bg-gradient-to-b from-[#ffffff00] to-[#00000071]"></div>
      <div className="absolute left-0 top-0 w-full h-full grid grid-rows-3">
        <div className="row-span-2" />
        <div className="row-span-1 grid place-items-center text-white text-3xl">
          <h1>{country}</h1>
        </div>
      </div>
    </div>
  );
}

export default function Singleplayer() {
  return (
    <DashboardWrapper>
      <div className="flex flex-row place-items-center">
        <div className="grid grid-cols-3 gap-4 w-full max-w-[1400px]">
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
