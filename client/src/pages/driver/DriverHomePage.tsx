import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import {
  Navigation,
  Bell,
  User,
  Car,
  Power,
  Wallet,
  Route,
} from "lucide-react";

import {
  useDriverStore,
} from "../../stores/driver/driver.store";

import {
  useDriverLocation,
  type DriverLocation,
} from "../../http/driver/hooks/use-driver-location";

import {
  useDriverRideStore,
} from "../../stores/driver/driver-ride.store";

import {
  connectDriverSocket,
  disconnectDriverSocket,
} from "../../common/helper";

import {
  useCurrentLocation,
} from "../../http/ride/hooks/use-current-location";

export default function DriverHomePage() {
  const [driverLocation, setDriverLocation] =
    useState<DriverLocation | null>(null);

  const {
    location,
  } = useCurrentLocation();

  const isOnline = useDriverStore(
    (state) => state.isOnline,
  );

  const setOnline = useDriverStore(
    (state) => state.setOnline,
  );

  const setOffline = useDriverStore(
    (state) => state.setOffline,
  );

  const rideRequest = useDriverRideStore(
    (state) => state.rideRequest,
  );

  const mapContainer =
    useRef<HTMLDivElement | null>(null);

  const mapRef =
    useRef<MapLibreMap | null>(null);

  const driverMarker =
    useRef<Marker | null>(null);

  const MAPTILER_API_KEY =
    import.meta.env.VITE_MAPTILER_API_KEY;

  useDriverLocation({
    enabled: isOnline,

    onLocationChange: (
      newLocation,
    ) => {
      setDriverLocation(
        newLocation,
      );
    },
  });

  useEffect(() => {
    if (
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

    const initialCenter: [
      number,
      number,
    ] = location
      ? [
          location.longitude,
          location.latitude,
        ]
      : [
          77.5946,
          12.9716,
        ];

    const map =
      new MapLibreMap({
        container:
          mapContainer.current,

        style:
          `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_API_KEY}`,

        center:
          initialCenter,

        zoom: 13,
      });

    map.addControl(
      new NavigationControl(),
      "top-right",
    );

    map.on(
      "load",
      () => {
        console.log(
          "Driver map loaded",
        );
      },
    );

    map.on(
      "error",
      (event) => {
        console.error(
          "Driver map error:",
          event.error,
        );
      },
    );

    mapRef.current = map;

    return () => {
      driverMarker.current?.remove();

      driverMarker.current = null;

      map.remove();

      mapRef.current = null;
    };
  }, [MAPTILER_API_KEY]);

  useEffect(() => {
    if (
      !mapRef.current ||
      !location ||
      driverLocation
    ) {
      return;
    }

    const currentLocation: [
      number,
      number,
    ] = [
      location.longitude,
      location.latitude,
    ];

    mapRef.current.flyTo({
      center:
        currentLocation,

      zoom: 15,

      duration: 800,
    });
  }, [
    location,
    driverLocation,
  ]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const currentLocation =
      driverLocation ?? location;

    if (!currentLocation) {
      return;
    }

    const lngLat: [
      number,
      number,
    ] = [
      currentLocation.longitude,
      currentLocation.latitude,
    ];

    if (!driverMarker.current) {
      driverMarker.current =
        new Marker({
          color: "#10b981",
        })
          .setLngLat(lngLat)
          .addTo(mapRef.current);
    } else {
      driverMarker.current.setLngLat(
        lngLat,
      );
    }

    if (driverLocation) {
      mapRef.current.easeTo({
        center: lngLat,
        zoom: 15,
        duration: 800,
      });
    }
  }, [
    driverLocation,
    location,
  ]);

  useEffect(() => {
    if (!isOnline) {
      disconnectDriverSocket();

      return;
    }

    const driverId = 101;

    connectDriverSocket(
      driverId,
      (message) => {
        if (
          message.type ===
          "RIDE_REQUEST"
        ) {
          useDriverRideStore
            .getState()
            .setRideRequest(
              message.data,
            );
        }
      },
    );

    return () => {
      disconnectDriverSocket();
    };
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      return;
    }

    if (driverMarker.current) {
      driverMarker.current.remove();

      driverMarker.current = null;
    }
  }, [isOnline]);

  const handleToggle = () => {
    if (isOnline) {
      setOffline();

      return;
    }

    setOnline();
  };

  const handleCurrentLocation =
    () => {
      if (
        !mapRef.current
      ) {
        return;
      }

      const currentLocation =
        driverLocation ?? location;

      if (!currentLocation) {
        return;
      }

      mapRef.current.flyTo({
        center: [
          currentLocation.longitude,
          currentLocation.latitude,
        ],

        zoom: 16,

        duration: 800,
      });
    };

  return (
    <>
      <main className="relative h-screen w-full overflow-hidden bg-slate-100">
        <div
          ref={mapContainer}
          className="absolute inset-0 h-full w-full"
        />

        <header className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xl">
            <span className="text-lg font-black tracking-tight text-slate-950">
              RIDOXL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl"
            >
              <Bell size={18} />
            </button>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl"
            >
              <User size={18} />
            </button>
          </div>
        </header>

        <div className="absolute left-4 top-24 z-20">
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-xl">
            <div className="flex items-center gap-2">
              <span
                className={`
                  h-2.5
                  w-2.5
                  rounded-full
                  ${
                    isOnline
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }
                `}
              />

              <span className="text-sm font-semibold text-slate-800">
                {isOnline
                  ? "Online"
                  : "Offline"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleCurrentLocation
          }
          disabled={
            !driverLocation &&
            !location
          }
          className="absolute right-4 top-24 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Navigation size={18} />
        </button>

        <section className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[30px] bg-white shadow-2xl md:bottom-5 md:left-5 md:right-auto md:w-[440px] md:rounded-[30px]">
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-xl
                      ${
                        isOnline
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    <Car size={16} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Driver
                  </p>
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                  {isOnline
                    ? "You're ready to ride"
                    : "Ready to start driving?"}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {isOnline
                    ? "You can receive ride requests"
                    : "Go online to start receiving rides"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`
                        h-2
                        w-2
                        rounded-full
                        ${
                          isOnline
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }
                      `}
                    />

                    <p className="text-sm font-semibold text-slate-900">
                      {isOnline
                        ? "You are online"
                        : "You are offline"}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {isOnline
                      ? "Waiting for nearby ride requests"
                      : "Go online to receive rides"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    handleToggle
                  }
                  className={`
                    relative
                    h-8
                    w-14
                    rounded-full
                    p-1
                    transition
                    ${
                      isOnline
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }
                  `}
                >
                  <span
                    className={`
                      block
                      h-6
                      w-6
                      rounded-full
                      bg-white
                      shadow
                      transition
                      ${
                        isOnline
                          ? "translate-x-6"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={
                  handleToggle
                }
                className={`
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  py-3.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  ${
                    isOnline
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-slate-950 hover:bg-slate-800"
                  }
                `}
              >
                <Power size={16} />

                {isOnline
                  ? "Go Offline"
                  : "Go Online"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Wallet size={15} />

                  <span className="text-xs">
                    Today's Earnings
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  ₹1,240
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Route size={15} />

                  <span className="text-xs">
                    Trips Today
                  </span>
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  8
                </p>
              </div>
            </div>

            {isOnline && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                    <Car size={18} />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Looking for rides
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      We'll notify you when a passenger requests a ride.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {rideRequest && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4">
            <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl">
                  🚕
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    New Ride Request
                  </h2>

                  <p className="text-sm text-slate-500">
                    Ride #
                    {rideRequest.ride_id}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    PICKUP
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {
                      rideRequest.pickup_latitude
                    }
                    ,{" "}
                    {
                      rideRequest.pickup_longitude
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    DESTINATION
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {
                      rideRequest.dropoff_latitude
                    }
                    ,{" "}
                    {
                      rideRequest.dropoff_longitude
                    }
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-400">
                    VEHICLE
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {
                      rideRequest.vehicle_type
                    }
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    useDriverRideStore
                      .getState()
                      .clearRideRequest()
                  }
                  className="rounded-xl border border-slate-200 py-3 font-semibold"
                >
                  Reject
                </button>

                <button
                  type="button"
                  className="rounded-xl bg-black py-3 font-semibold text-white"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}