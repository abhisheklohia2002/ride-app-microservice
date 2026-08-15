import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Clock3,
  MapPin,
  Search,
  X,
} from "lucide-react";

import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  autocompletePlaces,
  reverseGeocode,
  type PlacePrediction,
} from "@/api/places.api";

import { useRideStore } from "@/store/ride.store";

export function SearchScreen() {
  const navigate = useNavigate();

  const {
    pickup,
    setPickup,
    setDestination,
  } = useRideStore();

  const [query, setQuery] = useState("");

  const [predictions, setPredictions] = useState<
    PlacePrediction[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [selectingPlace, setSelectingPlace] =
    useState(false);

  /*
   * Used to prevent an older autocomplete
   * response from replacing a newer response.
   */
  const requestIdRef = useRef(0);

  /*
   * --------------------------------------------------
   * GET CURRENT LOCATION
   * --------------------------------------------------
   *
   * When SearchScreen opens:
   *
   * Browser GPS
   *     ↓
   * latitude / longitude
   *     ↓
   * Geoapify reverse geocoding
   *     ↓
   * pickup
   */

useEffect(() => {
  if (pickup) {
    setLocationLoading(false);
    return;
  }

  if (!navigator.geolocation) {
    toast.error(
      "Geolocation is not supported by your browser",
    );

    setLocationLoading(false);
    return;
  }

  let cancelled = false;

  setLocationLoading(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      if (cancelled) {
        return;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      try {
        const address = await reverseGeocode({
          lat,
          lng,
        });

        if (cancelled) {
          return;
        }

        setPickup({
          id: `current-location-${lat}-${lng}`,
          name: "Current location",
          address:
            address?.formatted ??
            "Current location",
          category: "home",
          coords: {
            lat,
            lng,
          },
        });
      } catch (error) {
        console.error(
          "Reverse geocoding failed:",
          error,
        );

        if (!cancelled) {
          setPickup({
            id: `current-location-${lat}-${lng}`,
            name: "Current location",
            address: "Current location",
            category: "home",
            coords: {
              lat,
              lng,
            },
          });
        }
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    },

    (error) => {
      if (cancelled) {
        return;
      }

      console.error(
        "Geolocation error:",
        error,
      );

      setLocationLoading(false);

      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error(
            "Please allow location access",
          );
          break;

        case error.POSITION_UNAVAILABLE:
          toast.error(
            "Your current location is unavailable",
          );
          break;

        case error.TIMEOUT:
          toast.error(
            "Location request timed out",
          );
          break;

        default:
          toast.error(
            "Unable to get your current location",
          );
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    },
  );

  return () => {
    cancelled = true;
  };
}, [pickup, setPickup]);


  useEffect(() => {
    /*
     * If pickup already exists, don't request
     * the user's location again.
     */
    if (pickup) {
      setLocationLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      toast.error(
        "Geolocation is not supported by your browser",
      );

      setLocationLoading(false);
      return;
    }

    let cancelled = false;

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (cancelled) {
          return;
        }

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          /*
           * Convert coordinates into a readable
           * address using Geoapify.
           */
          const address = await reverseGeocode({
            lat,
            lng,
          });

          if (cancelled) {
            return;
          }

          setPickup({
            id: `current-location-${lat}-${lng}`,

            name: "Current location",

            address:
              address?.formatted ??
              "Current location",

            category: "home",

            coords: {
              lat,
              lng,
            },
          });
        } catch (error) {
          console.error(
            "Reverse geocoding failed:",
            error,
          );

          /*
           * Even if reverse geocoding fails,
           * we still have valid GPS coordinates.
           */
          if (!cancelled) {
            setPickup({
              id: `current-location-${lat}-${lng}`,

              name: "Current location",

              address: "Current location",

              category: "other",

              coords: {
                lat,
                lng,
              },
            });

            toast.message(
              "Using your current coordinates",
            );
          }
        } finally {
          if (!cancelled) {
            setLocationLoading(false);
          }
        }
      },

      (error) => {
        if (cancelled) {
          return;
        }

        console.error(
          "Geolocation error:",
          error,
        );

        setLocationLoading(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(
              "Please allow location access to find your current location",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            toast.error(
              "Your current location is unavailable",
            );
            break;

          case error.TIMEOUT:
            toast.error(
              "Location request timed out",
            );
            break;

          default:
            toast.error(
              "Unable to get your current location",
            );
        }
      },

      {
        /*
         * Better accuracy for ride applications.
         */
        enableHighAccuracy: true,

        /*
         * Don't wait forever.
         */
        timeout: 10000,

        /*
         * Reuse a recent browser location
         * for up to 30 seconds.
         */
        maximumAge: 30000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, [pickup, setPickup]);

  /*
   * --------------------------------------------------
   * SEARCH DESTINATION
   * --------------------------------------------------
   *
   * User types:
   *
   * "airport"
   *
   * ↓
   *
   * Geoapify Autocomplete
   *
   * ↓
   *
   * predictions
   */

  useEffect(() => {
    const value = query.trim();

    /*
     * Don't call API for short queries.
     */
    if (value.length < 2) {
      setPredictions([]);
      setLoading(false);

      return;
    }

    /*
     * Every search gets a unique request ID.
     */
    const requestId =
      ++requestIdRef.current;

    /*
     * Debounce the request by 300ms.
     */
    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);

          const results =
            await autocompletePlaces(
              value,
              pickup?.coords,
            );

          /*
           * Ignore old API responses.
           */
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setPredictions(results);
        } catch (error) {
          console.error(
            "Geoapify autocomplete error:",
            error,
          );

          if (
            requestId ===
            requestIdRef.current
          ) {
            setPredictions([]);

            toast.error(
              error instanceof Error
                ? error.message
                : "Unable to search locations",
            );
          }
        } finally {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setLoading(false);
          }
        }
      },
      300,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, pickup]);

  /*
   * --------------------------------------------------
   * SELECT DESTINATION
   * --------------------------------------------------
   */

  const handleSelectPlace = (
    prediction: PlacePrediction,
  ) => {
    if (selectingPlace) {
      return;
    }

    try {
      setSelectingPlace(true);

      /*
       * Geoapify already gives us:
       *
       * - name
       * - address
       * - latitude
       * - longitude
       *
       * So we don't need another details API.
       */
      setDestination({
        id: prediction.placeId,

        name: prediction.name,

        address:
          prediction.description,

        category: "home",

        coords: {
          lat: prediction.lat,

          lng: prediction.lng,
        },
      });

      /*
       * Clear search state.
       */
      setQuery("");

      setPredictions([]);

      /*
       * Go to ride confirmation.
       */
      void navigate({
        to: "/confirm-ride",
      });
    } catch (error) {
      console.error(
        "Place selection failed:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to select this location",
      );
    } finally {
      setSelectingPlace(false);
    }
  };

  /*
   * --------------------------------------------------
   * CLEAR SEARCH
   * --------------------------------------------------
   */

  const clearSearch = () => {
    setQuery("");

    setPredictions([]);

    setLoading(false);

    /*
     * Invalidate previous requests.
     */
    requestIdRef.current++;
  };

  /*
   * --------------------------------------------------
   * BACK
   * --------------------------------------------------
   */

  const handleBack = () => {
    void navigate({
      to: "/",
    });
  };

  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <main
      className="
        min-h-dvh
        bg-background
        text-foreground
      "
    >
      {/* =============================================
          HEADER
      ============================================== */}

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
          Where to Today?
        </h1>
      </header>

      {/* =============================================
          SEARCH INPUT
      ============================================== */}

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
            onChange={(event) => {
              setQuery(
                event.target.value,
              );
            }}
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

      {/* =============================================
          CURRENT LOCATION
      ============================================== */}

      {!query && (
        <section className="px-5">
          <div
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
              {locationLoading ? (
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
              ) : (
                <MapPin
                  className="
                    h-4
                    w-4
                    text-primary
                  "
                />
              )}
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
                {locationLoading
                  ? "Getting your location..."
                  : "Current location"}
              </span>

              <span
                className="
                  mt-0.5
                  block
                  truncate
                  text-[12px]
                  text-muted-foreground
                "
              >
                {locationLoading
                  ? "Please allow location access"
                  : pickup?.address ??
                    "Location unavailable"}
              </span>
            </span>
          </div>
        </section>
      )}

      {/* =============================================
          SEARCH LOADING
      ============================================== */}

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

      {/* =============================================
          SEARCH RESULTS
      ============================================== */}

      {!loading &&
        predictions.length > 0 && (
          <section
            className="
              mt-3
              px-3
            "
          >
            {predictions.map(
              (prediction) => (
                <button
                  key={
                    prediction.placeId
                  }
                  type="button"
                  disabled={
                    selectingPlace
                  }
                  onClick={() =>
                    handleSelectPlace(
                      prediction,
                    )
                  }
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
                  {/* Location icon */}

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

                  {/* Place information */}

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
                      {
                        prediction.name
                      }
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
                      {
                        prediction.description
                      }
                    </span>
                  </span>
                </button>
              ),
            )}
          </section>
        )}

      {/* =============================================
          SELECTING PLACE
      ============================================== */}

      {selectingPlace && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-background/50
            backdrop-blur-sm
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              rounded-2xl
              border
              border-border
              bg-elevated
              px-5
              py-4
              shadow-xl
            "
          >
            <span
              className="
                h-5
                w-5
                animate-spin
                rounded-full
                border-2
                border-muted-foreground/30
                border-t-primary
              "
            />

            <span
              className="
                text-sm
                font-medium
              "
            >
              Selecting destination...
            </span>
          </div>
        </div>
      )}

      {/* =============================================
          NO RESULTS
      ============================================== */}

      {!loading &&
        !selectingPlace &&
        query.trim().length >= 2 &&
        predictions.length === 0 && (
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
              Try searching for a nearby
              landmark, street, area, or
              destination.
            </p>
          </div>
        )}

      {/* =============================================
          RECENT PLACES
      ============================================== */}

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
            Search for a destination to
            see matching places.
          </p>
        </section>
      )}
    </main>
  );
}