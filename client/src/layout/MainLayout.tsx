import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  LngLatBounds,
  type GeoJSONSource,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { motion } from "motion/react";

import {
  Bike,
  Car,
  Crown,
  Clock3,
  MapPin,
  Navigation,
  Route,
  X,
} from "lucide-react";

import {
  useCurrentLocation,
} from "../http/ride/hooks/use-current-location";

import {
  useCreateRide,
} from "../http/ride/hooks/use-rides";

import {
  useRideStore,
} from "../stores/ride/ride.store";

import type {
  VehicleType,
} from "../http/ride/dto";

import type {
  Destination,
} from "../http/ride/components/DestinationSearch";


type SearchResult = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};


export default function MainLayout() {
  const {
    location,
    loading,
    error,
  } = useCurrentLocation();

  const createRide =
    useCreateRide();

  const setRide =
    useRideStore(
      (state) =>
        state.setRide,
    );

  const [
    destination,
    setDestination,
  ] =
    useState<Destination | null>(
      null,
    );

  const [
    vehicle,
    setVehicle,
  ] =
    useState<VehicleType>(
      "CAR",
    );

  const [
    distance,
    setDistance,
  ] =
    useState<number | null>(
      null,
    );

  const [
    duration,
    setDuration,
  ] =
    useState<number | null>(
      null,
    );




  const mapContainer =
    useRef<HTMLDivElement | null>(
      null,
    );

  const mapRef =
    useRef<MapLibreMap | null>(
      null,
    );

  const pickupMarker =
    useRef<Marker | null>(
      null,
    );

  const destinationMarker =
    useRef<Marker | null>(
      null,
    );


  const MAPTILER_API_KEY =
    import.meta.env
      .VITE_MAPTILER_API_KEY;




  useEffect(() => {
    if (
      !location ||
      !mapContainer.current ||
      mapRef.current
    ) {
      return;
    }

    if (!MAPTILER_API_KEY) {
      console.error(
        "VITE_MAPTILER_API_KEY is missing",
      );

      return;
    }

    const map =
      new MapLibreMap({
        container:
          mapContainer.current,

        style:
          `https://api.maptiler.com/maps/streets-v4/style.json?key=${MAPTILER_API_KEY}`,

        center: [
          location.longitude,
          location.latitude,
        ],

        zoom: 13,
      });
map.on("load", () => {
  console.log("✅ MAP LOADED");

  console.log(
    "Canvas:",
    map.getCanvas(),
  );

  console.log(
    "Canvas size:",
    map.getCanvas().width,
    map.getCanvas().height,
  );

  console.log(
    "Container:",
    map.getContainer().getBoundingClientRect(),
  );
});
console.log(
  "WebGL:",
  map.getCanvas().getContext("webgl"),
);
map.on("error", (event) => {
  console.error(
    "❌ MAP ERROR:",
    event.error,
  );
});
    map.addControl(
      new NavigationControl(),
      "top-right",
    );

    mapRef.current =
      map;

    return () => {
      pickupMarker.current?.remove();

      destinationMarker.current?.remove();

      map.remove();

      mapRef.current =
        null;
    };
  }, [
    location,
    MAPTILER_API_KEY,
  ]);


  /*
   * =====================================================
   * PICKUP MARKER
   * =====================================================
   */

  useEffect(() => {
    const map =
      mapRef.current;

    if (
      !map ||
      !location
    ) {
      return;
    }

    pickupMarker.current?.remove();

    const element =
      document.createElement(
        "div",
      );

    element.innerHTML = `
      <div
        style="
          width:18px;
          height:18px;
          border-radius:50%;
          background:#10b981;
          border:4px solid white;
          box-shadow:0 3px 12px rgba(0,0,0,0.25);
        "
      ></div>
    `;

    pickupMarker.current =
      new Marker({
        element,
      })
        .setLngLat([
          location.longitude,
          location.latitude,
        ])
        .addTo(map);

  }, [
    location,
  ]);


  useEffect(() => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    destinationMarker.current?.remove();

    destinationMarker.current =
      null;

    if (!destination) {
      removeRoute(map);

      return;
    }

    const element =
      document.createElement(
        "div",
      );

    element.innerHTML = `
      <div
        style="
          width:22px;
          height:22px;
          border-radius:50% 50% 50% 0;
          background:#ef4444;
          border:3px solid white;
          transform:rotate(-45deg);
          box-shadow:0 3px 12px rgba(0,0,0,0.3);
        "
      ></div>
    `;

    destinationMarker.current =
      new Marker({
        element,
      })
        .setLngLat([
          destination.longitude,
          destination.latitude,
        ])
        .addTo(map);

  }, [
    destination,
  ]);




  const handleDestinationSelect =
    useCallback(
      (
        selectedDestination: Destination,
      ) => {
        setDestination(
          selectedDestination,
        );

        setDistance(null);

        setDuration(null);
      },
      [],
    );



  const handleRouteChange =
    useCallback(
      (
        distanceMeters: number,
        durationMillis: number,
      ) => {
        setDistance(
          distanceMeters,
        );

        setDuration(
          durationMillis,
        );
      },
      [],
    );




  const drawRoute =
  useCallback(
    (
      coordinates: [
        number,
        number,
      ][],
      distanceMeters: number,
      durationMillis: number,
    ) => {
      const map =
        mapRef.current;

      if (!map) {
        return;
      }

      const geojson = {
        type: "Feature" as const,

        properties: {},

        geometry: {
          type: "LineString" as const,
          coordinates,
        },
      };


      const existingSource =
        map.getSource(
          "ride-route",
        );


      if (existingSource) {

        const source =
          existingSource as GeoJSONSource;

        source.setData(
          geojson,
        );

      } else {

        map.addSource(
          "ride-route",
          {
            type: "geojson",
            data: geojson,
          },
        );


        map.addLayer({
          id: "ride-route",

          type: "line",

          source:
            "ride-route",

          layout: {
            "line-join":
              "round",

            "line-cap":
              "round",
          },

          paint: {
            "line-color":
              "#111827",

            "line-width":
              5,

            "line-opacity":
              0.9,
          },
        });
      }


    
      const bounds =
        new LngLatBounds();

      coordinates.forEach(
        (
          coordinate,
        ) => {
          bounds.extend(
            coordinate,
          );
        },
      );


      map.fitBounds(
        bounds,
        {
          padding: {
            top: 100,
            bottom: 400,
            left: 50,
            right: 50,
          },

          maxZoom: 15,

          duration: 900,
        },
      );


 
      handleRouteChange(
        distanceMeters,
        durationMillis,
      );
    },

    [
      handleRouteChange,
    ],
  );



useEffect(() => {
  if (
    !location ||
    !destination
  ) {
    return;
  }

  const fetchRoute =
    async () => {
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${location.longitude},${location.latitude};` +
          `${destination.longitude},${destination.latitude}` +
          `?overview=full&geometries=geojson`;

        const response =
          await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Routing failed: ${response.status}`,
          );
        }

        const data =
          await response.json();

        const route =
          data?.routes?.[0];

        if (!route) {
          console.error(
            "No route found",
          );

          return;
        }

        const coordinates =
          route.geometry
            ?.coordinates;

        if (
          !coordinates ||
          coordinates.length === 0
        ) {
          console.error(
            "Route geometry missing",
          );

          return;
        }

   
        drawRoute(
          coordinates,
          route.distance,
          route.duration,
        );

      } catch (error) {
        console.error(
          "Route error:",
          error,
        );
      }
    };

  fetchRoute();

}, [
  location,
  destination,
  drawRoute,
]);

  const handleRequestRide =
    () => {
      if (
        !location ||
        !destination
      ) {
        return;
      }

      createRide.mutate(
        {
          pickup: {
            latitude:
              location.latitude,

            longitude:
              location.longitude,

            address:
              "Current Location",
          },

          destination: {
            latitude:
              destination.latitude,

            longitude:
              destination.longitude,

            address:
              destination.address,
          },

          vehicle_type:
            vehicle,
        },

        {
          onSuccess: (
            response,
          ) => {
            const ride =
              response.ride;

            if (!ride) {
              return;
            }

            setRide(
              ride.id,
              ride.status as any,
            );
          },
        },
      );
    };



  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg">

            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

          </div>

          <p className="mt-4 text-sm font-medium text-slate-600">
            Getting your location...
          </p>

        </div>

      </main>
    );
  }




  if (
    error ||
    !location
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">

            <MapPin
              size={24}
              className="text-red-500"
            />

          </div>

          <h2 className="mt-5 text-xl font-bold">
            Location unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ??
              "Unable to get your location"}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>

        </div>

      </main>
    );
  }


  const distanceKm =
    distance !== null
      ? (
          distance / 1000
        ).toFixed(1)
      : null;

  const durationMinutes =
    duration !== null
      ? Math.ceil(
          duration / 60000,
        )
      : null;


  return (
    <main className="relative h-screen w-full overflow-hidden bg-slate-100">

      {/* MAP */}

      <div
        ref={mapContainer}
        className="absolute inset-0"
      />


      {/* LOGO */}

      <div className="absolute left-5 top-5 z-20 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xl">

        <span className="text-lg font-black text-slate-950">
          RIDOXL
        </span>

      </div>


      {/* CURRENT LOCATION */}

      <button
        type="button"
        onClick={() => {
          if (
            mapRef.current &&
            location
          ) {
            mapRef.current.flyTo({
              center: [
                location.longitude,
                location.latitude,
              ],

              zoom: 15,

              duration: 800,
            });
          }
        }}
        className="
          absolute
          right-5
          top-5
          z-20
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          border
          border-slate-200
          bg-white
          text-slate-700
          shadow-xl
        "
      >
        <Navigation
          size={18}
        />
      </button>


      {/* BOOKING CARD */}

      <motion.div
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="
          absolute
          bottom-0
          left-0
          right-0
          z-10
          rounded-t-[28px]
          bg-white
          shadow-2xl

          md:bottom-5
          md:left-5
          md:right-auto
          md:w-[440px]
          md:rounded-[28px]
        "
      >

        <div className="p-5 md:p-6">

          {/* HEADER */}

          <div className="flex items-start justify-between">

            <div>

              <div className="flex items-center gap-2">

                <div className="h-2 w-2 rounded-full bg-slate-950" />

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ride
                </p>

              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Where are you going?
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Choose your destination to get started
              </p>

            </div>


            {destination && (
              <button
                type="button"
                onClick={() => {
                  setDestination(
                    null,
                  );

                  setDistance(
                    null,
                  );

                  setDuration(
                    null,
                  );

                  if (
                    mapRef.current
                  ) {
                    removeRoute(
                      mapRef.current,
                    );
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={17} />
              </button>
            )}

          </div>


          {/* LOCATIONS */}

          <div className="mt-6">

            {/* PICKUP */}

            <div className="flex gap-3">

              <div className="flex w-7 shrink-0 justify-center">

                <div className="mt-3 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />

              </div>

              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Pickup
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  Current location
                </p>

              </div>

            </div>


            {/* LINE */}

            <div className="ml-[13px] h-5 border-l border-dashed border-slate-300" />


            {/* DESTINATION */}

            <div className="flex gap-3">

              <div className="flex w-7 shrink-0 justify-center">

                <div className="mt-3 h-3 w-3 rounded-full border-2 border-slate-900 bg-white" />

              </div>

              <div className="relative flex-1">

                <DestinationInput
                  latitude={
                    location.latitude
                  }
                  longitude={
                    location.longitude
                  }
                  onSelect={
                    handleDestinationSelect
                  }
                />

              </div>

            </div>

          </div>


          {/* ROUTE INFO */}

          {destination &&
            distanceKm &&
            durationMinutes && (
              <div className="mt-4 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-slate-50 p-3">

                  <div className="flex items-center gap-2 text-slate-400">

                    <Route
                      size={15}
                    />

                    <span className="text-xs">
                      Distance
                    </span>

                  </div>

                  <p className="mt-1 text-lg font-bold">

                    {distanceKm}

                    <span className="ml-1 text-xs font-medium text-slate-400">
                      km
                    </span>

                  </p>

                </div>


                <div className="rounded-xl bg-slate-50 p-3">

                  <div className="flex items-center gap-2 text-slate-400">

                    <Clock3
                      size={15}
                    />

                    <span className="text-xs">
                      ETA
                    </span>

                  </div>

                  <p className="mt-1 text-lg font-bold">

                    {durationMinutes}

                    <span className="ml-1 text-xs font-medium text-slate-400">
                      min
                    </span>

                  </p>

                </div>

              </div>
            )}


          {/* VEHICLE */}

          <div className="mt-5">

            <div className="mb-3 flex items-center justify-between">

              <p className="text-sm font-semibold">
                Choose your ride
              </p>

              <span className="text-xs text-slate-400">
                Select vehicle
              </span>

            </div>


            <div className="grid grid-cols-3 gap-2">

              {(
                [
                  "BIKE",
                  "CAR",
                  "PREMIUM",
                ] as VehicleType[]
              ).map(
                (type) => {

                  const selected =
                    vehicle ===
                    type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setVehicle(
                          type,
                        )
                      }
                      className={`
                        rounded-xl
                        border
                        p-3
                        text-left
                        transition

                        ${
                          selected
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }
                      `}
                    >

                      {type ===
                        "BIKE" && (
                        <Bike
                          size={20}
                        />
                      )}

                      {type ===
                        "CAR" && (
                        <Car
                          size={20}
                        />
                      )}

                      {type ===
                        "PREMIUM" && (
                        <Crown
                          size={20}
                        />
                      )}

                      <p className="mt-2 text-xs font-semibold">

                        {type ===
                        "PREMIUM"
                          ? "Premium"
                          : type ===
                              "BIKE"
                            ? "Bike"
                            : "Car"}

                      </p>

                    </button>
                  );
                },
              )}

            </div>

          </div>


          {/* REQUEST */}

          <motion.button
            whileTap={{
              scale: 0.98,
            }}
            type="button"
            disabled={
              !destination ||
              createRide.isPending
            }
            onClick={
              handleRequestRide
            }
            className="
              mt-5
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-slate-950
              py-3.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-slate-800
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >

            {createRide.isPending
              ? "Finding a driver..."
              : destination
                ? "Request Ride"
                : "Choose destination"}

            {!createRide.isPending &&
              destination && (
                <Navigation
                  size={16}
                />
              )}

          </motion.button>


          {createRide.isError && (
            <p className="mt-3 text-center text-xs text-red-500">
              Failed to create ride. Please try again.
            </p>
          )}

        </div>

      </motion.div>

    </main>
  );
}



type DestinationInputProps = {
  latitude: number;
  longitude: number;

  onSelect: (
    destination: Destination,
  ) => void;
};


function DestinationInput({
  latitude,
  longitude,
  onSelect,
}: DestinationInputProps) {
  const [
    query,
    setQuery,
  ] = useState("");

  const [
    results,
    setResults,
  ] = useState<
    SearchResult[]
  >([]);

  const [
    searching,
    setSearching,
  ] = useState(false);


  useEffect(() => {
    if (
      query.trim().length < 2
    ) {
      setResults([]);

      return;
    }


    const timer =
      setTimeout(
        async () => {
          try {
            setSearching(true);

            const key =
              import.meta.env
                .VITE_MAPTILER_API_KEY;

            if (!key) {
              console.error(
                "VITE_MAPTILER_API_KEY is missing",
              );

              return;
            }


            const url =
              `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json`;


            const params =
              new URLSearchParams({
                key,
                language: "en",
                limit: "5",

                proximity:
                  `${longitude},${latitude}`,
              });


            const response =
              await fetch(
                `${url}?${params.toString()}`,
              );


            if (!response.ok) {
              throw new Error(
                `MapTiler error: ${response.status}`,
              );
            }


            const data =
              await response.json();


            const locations: SearchResult[] =
              (
                data.features ??
                []
              ).map(
                (
                  feature: any,
                ) => {
                  const [
                    lon,
                    lat,
                  ] =
                    feature
                      ?.geometry
                      ?.coordinates ??
                    [];

                  return {
                    id:
                      feature.id,

                    address:
                      feature.place_name ??
                      feature.text ??
                      "Unknown location",

                    latitude:
                      lat,

                    longitude:
                      lon,
                  };
                },
              )
              .filter(
                (
                  item: SearchResult,
                ) =>
                  Number.isFinite(
                    item.latitude,
                  ) &&
                  Number.isFinite(
                    item.longitude,
                  ),
              );


            setResults(
              locations,
            );

          } catch (error) {
            console.error(
              "Destination search failed:",
              error,
            );

            setResults([]);

          } finally {
            setSearching(
              false,
            );
          }
        },
        350,
      );


    return () =>
      clearTimeout(timer);

  }, [
    query,
    latitude,
    longitude,
  ]);


  return (
    <div className="relative">

      <input
        value={query}
        onChange={(e) =>
          setQuery(
            e.target.value,
          )
        }
        placeholder="Search destination"
        className="
          h-12
          w-full
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-4
          text-sm
          font-medium
          text-slate-900
          outline-none
          placeholder:text-slate-400
          focus:border-slate-900
          focus:bg-white
        "
      />


      {searching && (
        <div className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      )}


      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">

          {results.map(
            (result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => {
                  setQuery(
                    result.address,
                  );

                  setResults([]);

                  onSelect(
                    result as Destination,
                  );
                }}
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

                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">

                  <MapPin
                    size={15}
                    className="text-slate-600"
                  />

                </div>


                <div className="min-w-0">

                  <p className="truncate text-sm font-medium text-slate-900">
                    {result.address}
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



function removeRoute(
  map: MapLibreMap,
) {
  if (
    map.getLayer(
      "ride-route",
    )
  ) {
    map.removeLayer(
      "ride-route",
    );
  }


  if (
    map.getSource(
      "ride-route",
    )
  ) {
    map.removeSource(
      "ride-route",
    );
  }
}




function toRadians(
  degrees: number,
): number {
  return (
    degrees *
    (Math.PI / 180)
  );
}