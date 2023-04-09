import { FiSearch } from "react-icons/fi";
import countrylist from "@/components/data/countrylist.json";
import { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import Image from "next/image";

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFiltered(countrylist.filter((country) => country.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Do something with the search term
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setSearchTerm("");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <form onSubmit={handleSubmit} className="relative z-50">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleChange}
          className="px-4 py-2 rounded-md outline-none pl-10 bg-[#0000003e] text-white text-xl w-1/3"
        />
        <button type="submit" className="absolute left-0 top-[6px] px-3 py-2">
          <FiSearch color="#FFFFFF" />
        </button>
        {searchTerm.length > 0 && filtered.length > 0 && (
          <div className="absolute z-50 mt-2 w-1/3 overflow-hidden">
            <div className="bg-[#1d1f3a] rounded-md text-white text-xl border-2 border-[#2d3556] py-2 px-3">
              <ul className="divide-y-[1px] divide-[#ffffff30]">
                {filtered.map((country, index) => {
                  return (
                    <li key={index} className="p-2 flex flex-row">
                      <div
                        className="w-8 h-8 mr-2 rounded-lg overflow-hidden"
                        style={{
                          backgroundImage: `url(/countries/${country.replaceAll(" ", "_")}.jpg)`,
                          backgroundPosition: "center center",
                          backgroundSize: "cover",
                        }}
                      ></div>
                      <a href={`/singleplayer/${country.replaceAll(" ", "_")}`}>{country}</a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
