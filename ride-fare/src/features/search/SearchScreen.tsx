import { useEffect, useRef, useState } from "react";

import { ArrowLeft, Clock3, MapPin, Search, X } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { autocompletePlaces, getPlaceDetails, type PlacePrediction } from "@/api/places.api";

import { useRideStore } from "@/store/ride.store";

import type { Place } from "@/types";

export function SearchScreen() {
  const navigate = useNavigate();

  const { pickup, setDestination } = useRideStore();

  const [query, setQuery] = useState("");

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);

  const [loading, setLoading] = useState(false);

  const [selectingPlace, setSelectingPlace] = useState(false);

  /*
   * Google Places session token.
   *
   * One token is used for:
   *
   * autocomplete requests
   *       ↓
   * selected place
   *       ↓
   * place details
   */

  const sessionTokenRef = useRef(crypto.randomUUID());

  /*
   * Prevent state update after
   * component unmount.
   */

  const requestIdRef = useRef(0);

  /*
   * --------------------------------------------------
   * Generate new Places session
   * --------------------------------------------------
   */

  const createNewSession = () => {
    sessionTokenRef.current = crypto.randomUUID();
  };

  /*
   * --------------------------------------------------
   * Search places
   * --------------------------------------------------
   */

  useEffect(() => {
    const value = query.trim();

    /*
     * Don't search for very short
     * queries.
     */

    if (value.length < 2) {
      setPredictions([]);
      setLoading(false);

      return;
    }

    /*
     * Create request id.
     *
     * This prevents an older API response
     * from overwriting a newer search.
     */

    const requestId = ++requestIdRef.current;

    /*
     * Debounce Google API calls.
     */

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);

        const results = await autocompletePlaces(value, sessionTokenRef.current);

        /*
         * Ignore stale response.
         */

        if (requestId !== requestIdRef.current) {
          return;
        }

        setPredictions(results);
      } catch (error) {
        console.error("Google Places autocomplete error:", error);

        if (requestId === requestIdRef.current) {
          setPredictions([]);

          toast.error("Unable to search locations");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  /*
   * --------------------------------------------------
   * Select place
   * --------------------------------------------------
   */

  const handleSelectPlace = async (prediction: PlacePrediction) => {
    if (selectingPlace) {
      return;
    }

    try {
      setSelectingPlace(true);

      /*
       * Get complete details.
       */

      const details = await getPlaceDetails(prediction.placeId, sessionTokenRef.current);

      /*
       * Google should return location.
       */

      if (!details.location) {
        throw new Error("Location coordinates are unavailable");
      }

      /*
       * Convert Google response
       * into your application's Place.
       */

      const place: Place = {
        id: details.id,

        name: details.displayName?.text ?? prediction.name,

        address: details.formattedAddress ?? prediction.description,

        coords: {
          lat: details.location.latitude,

          lng: details.location.longitude,
        },
      };

      /*
       * Save destination
       * in Zustand.
       */

      setDestination(place);

      /*
       * Clear current search.
       */

      setQuery("");

      setPredictions([]);

      /*
       * Start a new Google Places
       * session for the next search.
       */

      createNewSession();

      /*
       * Go to Confirm Ride.
       */

      void navigate({
        to: "/confirm-ride",
      });
    } catch (error) {
      console.error("Place selection failed:", error);

      toast.error(error instanceof Error ? error.message : "Unable to select this location");
    } finally {
      setSelectingPlace(false);
    }
  };

  /*
   * --------------------------------------------------
   * Clear search
   * --------------------------------------------------
   */

  const clearSearch = () => {
    setQuery("");
    setPredictions([]);

    /*
     * New session because the
     * current search has ended.
     */

    createNewSession();
  };

  /*
   * --------------------------------------------------
   * Back
   * --------------------------------------------------
   */

  const handleBack = () => {
    void navigate({
      to: "/",
    });
  };

  return (
    <main
      className="
        min-h-dvh
        bg-background
        text-foreground
      "
    >
      {/* =================================================
          HEADER
      ================================================== */}

      <header
        className="
          flex
          items-center
          gap-3
          px-5
          pb-3
          pt-safe
        "
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-border
            bg-elevated
            transition-transform
            active:scale-95
          "
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <h1
          className="
            font-display
            text-xl
            font-bold
          "
        >
          Where to?
        </h1>
      </header>

      {/* =================================================
          SEARCH INPUT
      ================================================== */}

      <section className="px-5">
        <div
          className="
            flex
            h-14
            items-center
            gap-3
            rounded-2xl
            border
            border-border
            bg-elevated
            px-4
            transition-colors
            focus-within:border-primary
          "
        >
          <Search
            className="
              h-5
              w-5
              shrink-0
              text-primary
            "
          />

          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search destination"
            className="
              min-w-0
              flex-1
              bg-transparent
              text-[15px]
              font-medium
              text-foreground
              outline-none
              placeholder:text-muted-foreground
            "
          />

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-muted
                text-muted-foreground
              "
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* =================================================
          CURRENT LOCATION
      ================================================== */}

      {!query && (
        <section className="px-5">
          <button
            type="button"
            onClick={() => {
              if (!pickup) {
                toast.error("Current location is not available");

                return;
              }

              setDestination(pickup);

              void navigate({
                to: "/confirm-ride",
              });
            }}
            className="
              mt-4
              flex
              w-full
              items-center
              gap-3
              rounded-2xl
              border
              border-border
              bg-elevated
              p-4
              text-left
              transition
              active:scale-[0.99]
            "
          >
            <span
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-primary/10
              "
            >
              <MapPin
                className="
                  h-4
                  w-4
                  text-primary
                "
              />
            </span>

            <span className="min-w-0">
              <span
                className="
                  block
                  text-[14px]
                  font-semibold
                  text-foreground
                "
              >
                Use current location
              </span>

              <span
                className="
                  mt-0.5
                  block
                  text-[12px]
                  text-muted-foreground
                "
              >
                {pickup?.address ?? "Your current location"}
              </span>
            </span>
          </button>
        </section>
      )}

      {/* =================================================
          SEARCHING
      ================================================== */}

      {loading && (
        <div
          className="
            flex
            items-center
            gap-3
            px-5
            py-5
            text-sm
            text-muted-foreground
          "
        >
          <span
            className="
              h-4
              w-4
              animate-spin
              rounded-full
              border-2
              border-muted-foreground/30
              border-t-primary
            "
          />
          Searching places...
        </div>
      )}

      {/* =================================================
          SEARCH RESULTS
      ================================================== */}

      {!loading && predictions.length > 0 && (
        <section
          className="
              mt-3
              px-3
            "
        >
          {predictions.map((prediction) => (
            <button
              key={prediction.placeId}
              type="button"
              disabled={selectingPlace}
              onClick={() => handleSelectPlace(prediction)}
              className="
                    flex
                    w-full
                    items-center
                    gap-4
                    rounded-2xl
                    p-4
                    text-left
                    transition-colors
                    hover:bg-muted
                    active:scale-[0.99]
                    disabled:opacity-60
                  "
            >
              {/* Icon */}

              <span
                className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-primary/10
                    "
              >
                <MapPin
                  className="
                        h-4
                        w-4
                        text-primary
                      "
                />
              </span>

              {/* Text */}

              <span
                className="
                      min-w-0
                      flex-1
                    "
              >
                <span
                  className="
                        block
                        truncate
                        text-[15px]
                        font-semibold
                        text-foreground
                      "
                >
                  {prediction.name}
                </span>

                <span
                  className="
                        mt-0.5
                        block
                        truncate
                        text-[13px]
                        text-muted-foreground
                      "
                >
                  {prediction.description}
                </span>
              </span>
            </button>
          ))}
        </section>
      )}

      {/* =================================================
          NO RESULTS
      ================================================== */}

      {!loading && query.trim().length >= 2 && predictions.length === 0 && (
        <div
          className="
              flex
              flex-col
              items-center
              justify-center
              px-5
              py-16
              text-center
            "
        >
          <span
            className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                bg-muted
              "
          >
            <MapPin
              className="
                  h-5
                  w-5
                  text-muted-foreground
                "
            />
          </span>

          <p
            className="
                mt-4
                text-sm
                font-semibold
                text-foreground
              "
          >
            No places found
          </p>

          <p
            className="
                mt-1
                max-w-xs
                text-[13px]
                text-muted-foreground
              "
          >
            Try searching for a nearby landmark, street, area, or destination.
          </p>
        </div>
      )}

      {/* =================================================
          RECENT / SAVED PLACE AREA
          
          Keep your existing saved/recent
          components here if you already
          have them.
      ================================================== */}

      {!query && (
        <section className="mt-5 px-5">
          <div
            className="
              mb-3
              flex
              items-center
              gap-2
            "
          >
            <Clock3
              className="
                h-4
                w-4
                text-muted-foreground
              "
            />

            <h2
              className="
                text-sm
                font-semibold
                text-foreground
              "
            >
              Recent places
            </h2>
          </div>

          <p
            className="
              text-[13px]
              text-muted-foreground
            "
          >
            Search for a destination to see matching places.
          </p>
        </section>
      )}
    </main>
  );
}
