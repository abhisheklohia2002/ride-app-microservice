
export interface Destination {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

import {
  useEffect,
  useState,
} from "react";

import {
  Search,
  MapPin,
  Loader2,
} from "lucide-react";
import type { GeocodingResult } from "../dto";
import { mapTilerService } from "../maptiler.service";



type DestinationSearchProps = {
  latitude: number;
  longitude: number;

  onSelect: (
    destination: GeocodingResult,
  ) => void;
};

export default function DestinationSearch({
  latitude,
  longitude,
  onSelect,
}: DestinationSearchProps) {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<
      GeocodingResult[]
    >([]);

  const [loading, setLoading] =
    useState(false);

  const [showResults, setShowResults] =
    useState(false);


  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer =
      setTimeout(
        async () => {
          try {
            setLoading(true);

            const data =
              await mapTilerService.searchLocation(
                query,
                {
                  latitude,
                  longitude,
                },
              );

            setResults(data);
            setShowResults(true);
          } catch (error) {
            console.error(
              "Location search failed:",
              error,
            );

            setResults([]);
          } finally {
            setLoading(false);
          }
        },
        400,
      );

    return () =>
      clearTimeout(timer);

  }, [
    query,
    latitude,
    longitude,
  ]);


  const handleSelect = (
    location: GeocodingResult,
  ) => {
    setQuery(
      location.address,
    );

    setShowResults(false);

    onSelect(location);
  };


  return (
    <div className="relative">

      {/* Input */}

      <div className="relative">

        <Search
          size={17}
          className="
            pointer-events-none
            absolute
            left-4
            top-1/2
            -translate-y-1/2
            text-slate-400
          "
        />

        <input
          value={query}
          onChange={(e) =>
            setQuery(
              e.target.value,
            )
          }
          onFocus={() => {
            if (results.length) {
              setShowResults(true);
            }
          }}
          placeholder="Search destination"
          className="
            h-12
            w-full
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            pl-11
            pr-10
            text-sm
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-slate-900
            focus:bg-white
          "
        />

        {loading && (
          <Loader2
            size={17}
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              animate-spin
              text-slate-400
            "
          />
        )}

      </div>


      {/* Suggestions */}

      {showResults &&
        results.length > 0 && (
          <div
            className="
              absolute
              left-0
              right-0
              top-[calc(100%+8px)]
              z-50
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
              p-1
              shadow-2xl
            "
          >

            {results.map(
              (location) => (
                <button
                  key={
                    location.id
                  }
                  type="button"
                  onClick={() =>
                    handleSelect(
                      location,
                    )
                  }
                  className="
                    flex
                    w-full
                    items-start
                    gap-3
                    rounded-lg
                    p-3
                    text-left
                    transition
                    hover:bg-slate-50
                  "
                >

                  <div
                    className="
                      mt-0.5
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-100
                    "
                  >
                    <MapPin
                      size={15}
                      className="text-slate-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {
                        location.address
                      }
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Select destination
                    </p>
                  </div>

                </button>
              ),
            )}

          </div>
        )}

    </div>
  );
}