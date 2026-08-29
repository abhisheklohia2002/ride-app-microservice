import { useCallback, useEffect, useRef, useState } from "react";

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

import { useCurrentLocation } from "../http/ride/hooks/use-current-location";
import {
  useActivePassengerRide,
  useCancelRide,
  useCreateRide,
} from "../http/ride/hooks/use-rides";
import { useRideStore } from "../stores/ride/ride.store";
import type { VehicleType } from "../http/ride/dto";
import { useAuthStore } from "../stores/auth/auth.store";
import {
  connectPassengerSocket,
  disconnectPassengerSocket,
} from "../common/passenger-socket";
import { useRideTrackingStore } from "../stores/ride/rideTracking.store";
import ProfileMenu from "../components/ProfileMenu";

type SearchResult = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};

export default function MainLayout() {
  const SEARCH_DURATION = 120;
  const [mapReady, setMapReady] = useState(false);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);

  const [searchStartedAt, setSearchStartedAt] = useState<number | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState(SEARCH_DURATION);

  const [rideSearchError, setRideSearchError] = useState<string | null>(null);
  const [rideCancellationNotice, setRideCancellationNotice] = useState(false);
  const { location, loading, error } = useCurrentLocation();
  const driverLocation = useRideTrackingStore((state) => state.driverLocation);
  const createRide = useCreateRide();
  const { setAssignedDriver, setDriverLocation } = useRideTrackingStore();
  const passengerId = useAuthStore((state) => state.user?.id);
  const assignedDriver = useRideTrackingStore((state) => state.assignedDriver);
  const setRide = useRideStore((state) => state.setRide);
  const clearRide = useRideStore((state) => state.clearRide);
  const rideID = useRideStore((state) => state.rideId);
  const {
    data: activeRideResponse,
    isLoading: activeRideLoading,
    isError: activeRideError,
  } = useActivePassengerRide(Number(passengerId));

  console.log(assignedDriver, "assignedDriver");
  const cancelRide = useCancelRide();
  const [pickup, setPickup] = useState<SearchResult | null>(null);

  const [destination, setDestination] = useState<SearchResult | null>(null);

  const [vehicle, setVehicle] = useState<VehicleType>("CAR");

  const [distance, setDistance] = useState<number | null>(null);

  const [duration, setDuration] = useState<number | null>(null);

  const mapContainer = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<MapLibreMap | null>(null);

  const pickupMarker = useRef<Marker | null>(null);

  const destinationMarker = useRef<Marker | null>(null);
  const driverMarker = useRef<Marker | null>(null);
  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
  const minutes = Math.floor(remainingSeconds / 60);

  const seconds = remainingSeconds % 60;

  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;

  useEffect(() => {
    if (!location || pickup) {
      return;
    }

    setPickup({
      id: "current-location",
      address: "Current Location",
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }, [location, pickup]);

  useEffect(() => {
    if (
      !location ||
      !mapContainer.current ||
      mapRef.current ||
      !MAPTILER_API_KEY
    ) {
      return;
    }

    const map = new MapLibreMap({
      container: mapContainer.current,

      style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_API_KEY}`,

      center: [location.longitude, location.latitude],

      zoom: 13,
    });

    map.addControl(new NavigationControl(), "top-right");

    map.on("load", () => {
      console.log("MAP LOADED");
      setMapReady(true);
    });

    map.on("error", (event) => {
      console.error("MAP ERROR:", event.error);
    });

    mapRef.current = map;

    return () => {
      setMapReady(false);
      pickupMarker.current?.remove();
      destinationMarker.current?.remove();
      driverMarker.current?.remove();

      if (map.getLayer("ride-route")) {
        map.removeLayer("ride-route");
      }

      if (map.getSource("ride-route")) {
        map.removeSource("ride-route");
      }

      map.remove();
      mapRef.current = null;
      pickupMarker.current = null;
      destinationMarker.current = null;
      driverMarker.current = null;
    };
  }, [location, MAPTILER_API_KEY]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !pickup) {
      return;
    }

    pickupMarker.current?.remove();

    const element = document.createElement("div");

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
      >
      P  
      </div>
    `;

    pickupMarker.current = new Marker({
      element,
    })
      .setLngLat([pickup.longitude, pickup.latitude])
      .addTo(map);
  }, [pickup, mapReady]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    destinationMarker.current?.remove();

    destinationMarker.current = null;

    if (!destination) {
      removeRoute(map);

      setDistance(null);
      setDuration(null);

      return;
    }

    const element = document.createElement("div");

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

    destinationMarker.current = new Marker({
      element,
    })
      .setLngLat([destination.longitude, destination.latitude])
      .addTo(map);
  }, [destination, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !pickup) {
      return;
    }

    mapRef.current.flyTo({
      center: [pickup.longitude, pickup.latitude],
      zoom: 14,
      duration: 700,
    });
  }, [pickup]);

  const handlePickupSelect = useCallback((selectedPickup: SearchResult) => {
    setPickup(selectedPickup);
    setDestination(null);
    setDistance(null);
    setDuration(null);

    if (mapRef.current) {
      removeRoute(mapRef.current);
    }
  }, []);

  const handleDestinationSelect = useCallback(
    (selectedDestination: SearchResult) => {
      setDestination(selectedDestination);

      setDistance(null);
      setDuration(null);
    },
    [],
  );

  const handleRouteChange = useCallback(
    (distanceMeters: number, durationMillis: number) => {
      setDistance(distanceMeters);

      setDuration(durationMillis);
    },
    [],
  );

  const drawRoute = useCallback(
    (
      coordinates: [number, number][],
      distanceMeters: number,
      durationMillis: number,
    ) => {
      const map = mapRef.current;

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

      const updateRoute = () => {
        const existingSource = map.getSource("ride-route");

        if (existingSource) {
          const source = existingSource as GeoJSONSource;

          source.setData(geojson);

          return;
        }

        map.addSource("ride-route", {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: "ride-route",
          type: "line",
          source: "ride-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#111827",
            "line-width": 5,
            "line-opacity": 0.9,
          },
        });
      };

      if (map.isStyleLoaded()) {
        updateRoute();
      } else {
        map.once("load", updateRoute);
      }

      const bounds = new LngLatBounds();

      coordinates.forEach((coordinate) => {
        bounds.extend(coordinate);
      });

      map.fitBounds(bounds, {
        padding: {
          top: 100,
          bottom: 400,
          left: 50,
          right: 50,
        },
        maxZoom: 15,
        duration: 900,
      });

      handleRouteChange(distanceMeters, durationMillis);
    },
    [handleRouteChange],
  );
  useEffect(() => {
    if (!isSearchingDriver || !searchStartedAt) {
      return;
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - searchStartedAt) / 1000);

      const remaining = Math.max(SEARCH_DURATION - elapsed, 0);

      setRemainingSeconds(remaining);

      if (remaining === 0) {
        setIsSearchingDriver(false);
      }
    };

    updateTimer();

    const timer = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isSearchingDriver, searchStartedAt]);
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !driverLocation) {
      return;
    }

    const position: [number, number] = [
      driverLocation.longitude,
      driverLocation.latitude,
    ];

    if (!driverMarker.current) {
      const element = document.createElement("div");

      element.innerHTML = `
      <div
        style="
          width:32px;
          height:32px;
          border-radius:50%;
          background:#111827;
          border:4px solid white;
          box-shadow:0 4px 14px rgba(0,0,0,0.3);
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:16px;
        "
      >
        🚕
      </div>
    `;

      driverMarker.current = new Marker({
        element,
      })
        .setLngLat(position)
        .addTo(map);

      return;
    }

    driverMarker.current.setLngLat(position);
  }, [driverLocation, mapReady]);
  useEffect(() => {
    if (!pickup || !destination) {
      if (mapRef.current) {
        removeRoute(mapRef.current);
      }

      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${pickup.longitude},${pickup.latitude};` +
          `${destination.longitude},${destination.latitude}` +
          `?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Routing failed: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        const route = data?.routes?.[0];

        if (!route) {
          console.error("No route found");

          return;
        }

        const coordinates = route.geometry?.coordinates;

        if (!coordinates || coordinates.length === 0) {
          console.error("Route geometry missing");

          return;
        }

        drawRoute(
          coordinates as [number, number][],
          route.distance,
          route.duration,
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Route error:", error);
        }
      }
    };

    fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [pickup, destination, drawRoute, mapReady]);

  const handleRequestRide = () => {
    if (!pickup || !destination || !passengerId) {
      return;
    }

    setRideSearchError(null);

    createRide.mutate(
      {
        pickup: {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          address: pickup.address,
        },

        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
          address: destination.address,
        },

        vehicle_type: vehicle,

        passengerID: Number(passengerId),
      },
      {
        onSuccess: (response: any) => {
          console.log("CREATE RIDE RESPONSE:", response);

          const ride = response?.data?.ride;

          if (!ride) {
            console.error("Ride missing in response:", response);

            return;
          }

          console.log("RIDE CREATED:", ride);

          setRide(ride.id, ride.status as any);

          setRemainingSeconds(SEARCH_DURATION);

          setSearchStartedAt(Date.now());

          setIsSearchingDriver(true);
        },

        onError: (error: Error) => {
          console.error("CREATE RIDE FAILED:", error);

          setIsSearchingDriver(false);
          setSearchStartedAt(null);
          setRemainingSeconds(SEARCH_DURATION);
        },
      },
    );
  };

  const handleCancelSearch = () => {
    if (!rideID) {
      return;
    }

    cancelRide.mutate(
      {
        rideId: rideID,
        cancelledBy: "PASSENGER",
      },
      {
        onSuccess: () => {
          setIsSearchingDriver(false);
          setSearchStartedAt(null);
          setRemainingSeconds(SEARCH_DURATION);
          setRideSearchError(null);

          useRideTrackingStore.getState().clearRideTracking();
          clearRide();
        },
        onError: (error: Error) => {
          console.error("Failed to cancel ride:", error);
        },
      },
    );
  };

  const handleCancelRide = () => {
    console.log(rideID);
    if (!rideID) {
      return;
    }
    cancelRide.mutate(
      {
        rideId: rideID,
        cancelledBy: "PASSENGER",
        // driverId:
      },
      {
        onSuccess: () => {
          useRideTrackingStore.getState().clearRideTracking();
          clearRide();
        },
        onError: (error: Error) => {
          console.error("Failed to cancel ride:", error);
          clearRide();
        },
      },
    );
  };
  const handleUseCurrentLocation = () => {
    if (!location) {
      return;
    }

    setPickup({
      id: "current-location",
      address: "Current Location",
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };
  useEffect(() => {
  const ride = activeRideResponse?.data?.ride;

  if (!ride) {
    return;
  }

  setRide(
    ride.id,
    ride.status as any,
  );

  if (
    ride.status === "DRIVER_ASSIGNED" ||
    ride.status === "DRIVER_ARRIVING" ||
    ride.status === "DRIVER_ARRIVED" ||
    ride.status === "TRIP_STARTED"
  ) {
    setIsSearchingDriver(false);
    setSearchStartedAt(null);
    setRemainingSeconds(SEARCH_DURATION);
    setRideSearchError(null);
  }

  setPickup({
    id: "pickup",
    address:
      ride.pickup.address ?? "Pickup",
    latitude:
      ride.pickup.latitude,
    longitude:
      ride.pickup.longitude,
  });

  setDestination({
    id: "destination",
    address:
      ride.destination.address ??
      "Destination",
    latitude:
      ride.destination.latitude,
    longitude:
      ride.destination.longitude,
  });

  if (ride.driver_id) {
    setAssignedDriver({
      id: ride.driver_id,
      name: "Driver",
    });
  }

  useRideTrackingStore
    .getState()
    .setActiveRide({
      id: ride.id,
      passengerId: ride.passenger_id,
      driverId: ride.driver_id,
      status: ride.status,
      pickupLatitude:
        ride.pickup.latitude,
      pickupLongitude:
        ride.pickup.longitude,
      dropoffLatitude:
        ride.destination.latitude,
      dropoffLongitude:
        ride.destination.longitude,
    });
}, [
  activeRideResponse,
  setRide,
  setAssignedDriver,
]);
  useEffect(() => {
    if (!passengerId) {
      return;
    }

    connectPassengerSocket(Number(passengerId), (message) => {
      if (message.type === "RIDE_ASSIGNED") {
        setIsSearchingDriver(false);
        setSearchStartedAt(null);
        setRemainingSeconds(SEARCH_DURATION);
        setRideSearchError(null);

        setAssignedDriver({
          id: message.data.driver_id,
          name: message.data.driver_name,
        });
      }
      if (message.type === "DRIVER_LOCATION_UPDATED") {
        setDriverLocation({
          latitude: message.data.latitude,
          longitude: message.data.longitude,
        });
      }
      if (message.type === "RIDE_SEARCH_EXPIRED") {
        setIsSearchingDriver(false);
        setSearchStartedAt(null);
        setRemainingSeconds(SEARCH_DURATION);

        useRideTrackingStore.getState().clearRideTracking();

        setRideSearchError("No driver found. Please try again.");
      }
      if (message.type === "RIDE_CANCELLED") {
        const cancelledRide = message.data as {
          ride_id: number;
          cancelled_by: "PASSENGER" | "DRIVER";
        };

        if (cancelledRide.ride_id !== useRideStore.getState().rideId) {
          return;
        }

        setIsSearchingDriver(false);
        setSearchStartedAt(null);
        setRemainingSeconds(SEARCH_DURATION);
        setRideSearchError(null);
        useRideTrackingStore.getState().clearRideTracking();
        clearRide();
        driverMarker.current?.remove();
        driverMarker.current = null;

        if (mapRef.current) {
          removeDriverRoute(mapRef.current);
        }

        if (cancelledRide.cancelled_by === "DRIVER") {
          setRideCancellationNotice(true);
        }
      }
    });

    return () => {
      disconnectPassengerSocket();
    };
  }, [passengerId, setAssignedDriver, setDriverLocation, clearRide]);

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

  if (error || !location) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <MapPin size={24} className="text-red-500" />
          </div>

          <h2 className="mt-5 text-xl font-bold">Location unavailable</h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ?? "Unable to get your location"}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const distanceKm = distance !== null ? (distance / 1000).toFixed(1) : null;

  const durationMinutes =
    duration !== null ? Math.ceil(duration / 60000) : null;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-slate-100">
      <div ref={mapContainer} className="absolute inset-0" />

      <div className="absolute left-5 top-5 z-20 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xl">
        <span className="text-lg font-black text-slate-950">RIDOXL</span>
      </div>

      <button
        type="button"
        onClick={() => {
          if (mapRef.current && pickup) {
            mapRef.current.flyTo({
              center: [pickup.longitude, pickup.latitude],
              zoom: 15,
              duration: 800,
            });
          }
        }}
        className="absolute right-5 top-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl"
      >
        <Navigation size={18} />
      </button>
      <div className="absolute right-5 bottom-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl">
        <ProfileMenu />
      </div>

      {rideSearchError && (
        <section className="absolute bottom-5 left-5 right-5 z-40 mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-lg font-bold text-slate-950">No driver found</h2>

          <p className="mt-1 text-sm text-slate-500">
            No nearby driver was available.
          </p>

          <button
            type="button"
            onClick={() => setRideSearchError(null)}
            className="mt-5 w-full rounded-xl bg-slate-950 py-3 font-semibold text-white"
          >
            Try Again
          </button>
        </section>
      )}
      {rideCancellationNotice && (
        <section className="absolute bottom-5 left-5 right-5 z-50 mx-auto max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
          <h2 className="text-lg font-bold text-slate-950">
            Driver did not accept the ride
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            The driver cancelled the request. Please try again.
          </p>

          <button
            type="button"
            onClick={() => setRideCancellationNotice(false)}
            className="mt-5 w-full rounded-xl bg-slate-950 py-3 font-semibold text-white"
          >
            Try Again
          </button>
        </section>
      )}
      {assignedDriver && (
        <section className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[30px] bg-white p-5 shadow-2xl md:bottom-5 md:left-5 md:right-auto md:w-[440px] md:rounded-[30px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl">
                🚕
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Driver Assigned
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  {assignedDriver?.name || "N/A"}
                </h2>

                <p className="text-sm text-slate-500">
                  Your driver is on the way
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">⭐ 4.8</p>

              <p className="text-xs text-slate-400">CAR</p>
            </div>
          </div>

          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white"
          >
            Call Driver
          </button>

          <button
            type="button"
            onClick={handleCancelRide}
            disabled={cancelRide.isPending}
            className="mt-3 w-full rounded-xl border border-red-200 py-3.5 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelRide.isPending ? "Cancelling..." : "Cancel Ride"}
          </button>
        </section>
      )}
      {isSearchingDriver && (
        <section className="absolute bottom-0 left-0 right-0 z-40 rounded-t-[30px] bg-white p-6 shadow-2xl md:bottom-5 md:left-5 md:right-auto md:w-[440px] md:rounded-[30px]">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-950">
              Finding your driver
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Searching nearby drivers
            </p>

            <p className="mt-5 text-3xl font-black text-slate-950">
              {formattedTime}
            </p>

            <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">
              Time remaining
            </p>

            <button
              type="button"
              onClick={handleCancelSearch}
              disabled={cancelRide.isPending || !rideID}
              className="mt-6 w-full rounded-xl border border-red-200 py-3.5 text-sm font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelRide.isPending ? "Cancelling..." : "Cancel Request"}
            </button>
          </div>
        </section>
      )}
      {!isSearchingDriver && !assignedDriver && !rideSearchError && (
        <motion.div
          drag="y"
          dragConstraints={{
            top: -200,
            bottom: 0,
          }}
          dragElastic={0.1}
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="absolute bottom-0 left-0 right-0 z-10 rounded-t-[28px] bg-white shadow-2xl md:bottom-5 md:left-5 md:right-auto md:w-[440px] md:rounded-[28px]"
        >
          <div className="p-5 md:p-6">
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
                  Choose pickup and destination
                </p>
              </div>

              {(pickup || destination) && (
                <button
                  type="button"
                  onClick={() => {
                    setPickup(
                      location
                        ? {
                            id: "current-location",
                            address: "Current Location",
                            latitude: location.latitude,
                            longitude: location.longitude,
                          }
                        : null,
                    );

                    setDestination(null);

                    setDistance(null);

                    setDuration(null);

                    if (mapRef.current) {
                      removeRoute(mapRef.current);
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="mt-6">
              <div className="flex gap-3">
                <div className="flex w-7 shrink-0 justify-center">
                  <div className="mt-3 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                </div>

                <div className="relative flex-1">
                  <LocationSearchInput
                    latitude={location.latitude}
                    longitude={location.longitude}
                    value={pickup?.address ?? ""}
                    placeholder="Search pickup"
                    label="Pickup"
                    onSelect={handlePickupSelect}
                  />

                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="mt-2 text-xs font-semibold text-slate-600 hover:text-slate-950"
                  >
                    Use current location
                  </button>
                </div>
              </div>

              <div className="ml-[13px] h-5 border-l border-dashed border-slate-300" />

              <div className="flex gap-3">
                <div className="flex w-7 shrink-0 justify-center">
                  <div className="mt-3 h-3 w-3 rounded-full border-2 border-slate-900 bg-white" />
                </div>

                <div className="relative flex-1">
                  <LocationSearchInput
                    latitude={pickup?.latitude ?? location.latitude}
                    longitude={pickup?.longitude ?? location.longitude}
                    value={destination?.address ?? ""}
                    placeholder="Search destination"
                    label="Destination"
                    onSelect={handleDestinationSelect}
                  />
                </div>
              </div>
            </div>

            {destination && distanceKm && durationMinutes && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Route size={15} />

                    <span className="text-xs">Distance</span>
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
                    <Clock3 size={15} />

                    <span className="text-xs">ETA</span>
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

            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Choose your ride</p>

                <span className="text-xs text-slate-400">Select vehicle</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["BIKE", "CAR", "PREMIUM"] as VehicleType[]).map((type) => {
                  const selected = vehicle === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicle(type)}
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
                      {type === "BIKE" && <Bike size={20} />}

                      {type === "CAR" && <Car size={20} />}

                      {type === "PREMIUM" && <Crown size={20} />}

                      <p className="mt-2 text-xs font-semibold">
                        {type === "PREMIUM"
                          ? "Premium"
                          : type === "BIKE"
                            ? "Bike"
                            : "Car"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <motion.button
              whileTap={{
                scale: 0.98,
              }}
              type="button"
              disabled={
                !pickup || !destination || !passengerId || createRide.isPending
              }
              onClick={handleRequestRide}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {createRide.isPending
                ? "Finding a driver..."
                : pickup && destination
                  ? "Request Ride"
                  : "Choose pickup and destination"}

              {!createRide.isPending && pickup && destination && (
                <Navigation size={16} />
              )}
            </motion.button>

            {createRide.isError && (
              <p className="mt-3 text-center text-xs text-red-500">
                Failed to create ride. Please try again.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </main>
  );
}

type LocationSearchInputProps = {
  latitude: number;
  longitude: number;
  value: string;
  placeholder: string;
  label: string;
  onSelect: (location: SearchResult) => void;
};

function LocationSearchInput({
  latitude,
  longitude,
  value,
  placeholder,
  label,
  onSelect,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(value);

  const [results, setResults] = useState<SearchResult[]>([]);

  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2 || trimmed === value) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const key = import.meta.env.VITE_MAPTILER_API_KEY;

        if (!key) {
          console.error("VITE_MAPTILER_API_KEY is missing");

          return;
        }

        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(trimmed)}.json`;

        const params = new URLSearchParams({
          key,
          language: "en",
          limit: "5",
          proximity: `${longitude},${latitude}`,
        });

        const response = await fetch(`${url}?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`MapTiler error: ${response.status}`);
        }

        const data = await response.json();

        const locations: SearchResult[] = (data.features ?? [])
          .map((feature: any) => {
            const [lon, lat] = feature?.geometry?.coordinates ?? [];

            return {
              id: feature.id,
              address: feature.place_name ?? feature.text ?? "Unknown location",
              latitude: lat,
              longitude: lon,
            };
          })
          .filter(
            (item: SearchResult) =>
              Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
          );

        setResults(locations);
      } catch (error) {
        console.error(`${label} search failed:`, error);

        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, latitude, longitude, value, label]);

  return (
    <div className="relative">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
      />

      {searching && (
        <div className="absolute right-4 top-[calc(50%+10px)] h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      )}

      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-2xl">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                setQuery(result.address);

                setResults([]);

                onSelect(result);
              }}
              className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition hover:bg-slate-50"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                <MapPin size={15} className="text-slate-600" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {result.address}
                </p>

                <p className="mt-0.5 text-xs text-slate-400">Select location</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function removeRoute(map: MapLibreMap) {
  if (map.getLayer("ride-route")) {
    map.removeLayer("ride-route");
  }

  if (map.getSource("ride-route")) {
    map.removeSource("ride-route");
  }
}

function removeDriverRoute(map: MapLibreMap) {
  if (map.getLayer("driver-route")) {
    map.removeLayer("driver-route");
  }

  if (map.getSource("driver-route")) {
    map.removeSource("driver-route");
  }
}
