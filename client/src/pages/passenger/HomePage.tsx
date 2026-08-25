import { useCallback, useState } from "react";

import { motion } from "motion/react";
import { useCurrentLocation } from "../../http/ride/hooks/use-current-location";
import { useCreateRide } from "../../http/ride/hooks/use-rides";
import { useRideStore } from "../../stores/ride/ride.store";
import type { Destination } from "../../http/ride/components/DestinationSearch";
import type { VehicleType } from "../../http/ride/dto";
import RideMap from "../../http/ride/components/RideMap";
import DestinationSearch from "../../http/ride/components/DestinationSearch";
import { useAuthStore } from "../../stores/auth/auth.store";

export default function HomePage() {
  const { location, loading, error } = useCurrentLocation();
  const passengerId = useAuthStore((state) => state.user?.id);
  const createRide = useCreateRide();

  const setRide = useRideStore((state) => state.setRide);

  const [destination, setDestination] = useState<Destination | null>(null);

  const [vehicle, setVehicle] = useState<VehicleType>("CAR");

  const [distance, setDistance] = useState<number | null>(null);

  const [duration, setDuration] = useState<number | null>(null);

  /*
   * Destination selected
   */

  const handleDestinationSelect = useCallback((destination: Destination) => {
    setDestination(destination);

    setDistance(null);
    setDuration(null);
  }, []);

  /*
   * Route calculated
   */

  const handleRouteChange = useCallback(
    (distanceMeters: number, durationMillis: number) => {
      setDistance(distanceMeters);

      setDuration(durationMillis);
    },
    [],
  );

  /*
   * Create ride
   */

  const handleRequestRide = () => {
    if (!location || !destination) {
      return;
    }

    createRide.mutate(
      {
        pickup: {
          latitude: location.latitude,

          longitude: location.longitude,

          address: "Current Location",
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
        onSuccess: (response) => {
          const ride = response.ride;

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

  /*
   * Loading
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Getting your location...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Location error
   */

  if (error || !location) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-2xl bg-white p-6 text-center shadow-xl">
          <h2 className="text-xl font-semibold">Location unavailable</h2>

          <p className="mt-2 text-sm text-slate-500">
            {error ?? "Unable to get your location"}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-white"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const distanceKm = distance != null ? (distance / 1000).toFixed(1) : null;

  const durationMinutes = duration != null ? Math.ceil(duration / 60000) : null;

  return (
    <main className="h-screen overflow-hidden">
      <div className="relative h-full">
        {/* ================= MAP ================= */}

        <RideMap
          pickup={{
            latitude: location.latitude,

            longitude: location.longitude,
          }}
          destination={
            destination
              ? {
                  latitude: destination.latitude,

                  longitude: destination.longitude,
                }
              : null
          }
          onRouteChange={handleRouteChange}
        />

        {/* ================= BOOKING CARD ================= */}

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="absolute bottom-0 left-0 right-0 z-10 rounded-t-[28px] bg-white p-5 shadow-2xl md:bottom-5 md:left-5 md:right-auto md:w-[440px] md:rounded-[28px]"
        >
          {/* HEADER */}

          <div>
            <p className="text-sm font-medium text-slate-400">Ride</p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Where are you going?
            </h1>
          </div>

          {/* LOCATIONS */}

          <div className="mt-5">
            {/* PICKUP */}

            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500 ring-4 ring-green-100" />
              </div>

              <div className="flex-1 rounded-xl bg-slate-100 px-4 py-3">
                <p className="text-xs text-slate-400">Pickup</p>

                <p className="text-sm font-medium text-slate-800">
                  Current location
                </p>
              </div>
            </div>

            {/* CONNECTING LINE */}

            <div className="ml-[13px] h-6 border-l border-dashed border-slate-300" />

            {/* DESTINATION */}

            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-red-500 ring-4 ring-red-100" />
              </div>

              <div className="flex-1">
                <DestinationSearch
                  latitude={location.latitude}
                  longitude={location.longitude}
                  onSelect={handleDestinationSelect}
                />
              </div>
            </div>
          </div>

          {/* DESTINATION INFO */}

          {destination && (
            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-4 rounded-xl bg-slate-50 p-4"
            >
              <p className="text-xs text-slate-400">Destination</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {destination.address}
              </p>

              {distanceKm && durationMinutes && (
                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Distance</p>

                    <p className="text-sm font-semibold">{distanceKm} km</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">ETA</p>

                    <p className="text-sm font-semibold">
                      {durationMinutes} min
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* VEHICLE */}

          <div className="mt-5">
            <p className="mb-3 text-sm font-semibold">Choose your ride</p>

            <div className="grid grid-cols-3 gap-2">
              {(["BIKE", "CAR", "PREMIUM"] as VehicleType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVehicle(type)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    vehicle === type
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* REQUEST */}

          <motion.button
            whileTap={{
              scale: 0.98,
            }}
            type="button"
            disabled={!destination || createRide.isPending}
            onClick={handleRequestRide}
            className="mt-5 w-full rounded-xl bg-slate-900 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {createRide.isPending
              ? "Finding a driver..."
              : destination
                ? "Request Ride"
                : "Choose destination"}
          </motion.button>

          {createRide.isError && (
            <p className="mt-3 text-center text-sm text-red-500">
              Failed to create ride.
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
