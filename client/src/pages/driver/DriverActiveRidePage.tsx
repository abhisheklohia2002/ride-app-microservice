import { useCallback, useEffect, useRef, useState } from "react";

import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  LngLatBounds,
  type GeoJSONSource,
} from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import { Navigation, Phone, Car } from "lucide-react";

import {
  useDriverLocation,
  type DriverLocation,
} from "../../http/driver/hooks/use-driver-location";
import ProfileMenu from "../../components/ProfileMenu";
import { useCompleteRide } from "../../http/ride/hooks/use-rides";
import { useDriverRideStore } from "../../stores/driver/driver-ride.store";

interface ActiveRide {
  id: number;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
}

interface Props {
  ride: ActiveRide;
}

export default function DriverActiveRidePage({ ride }: Props) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(
    null,
  );

  const [mapReady, setMapReady] = useState(false);
  const rideRequest = useDriverRideStore((state) => state.rideRequest);

  const mapContainer = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<MapLibreMap | null>(null);

  const driverMarker = useRef<Marker | null>(null);

  const pickupMarker = useRef<Marker | null>(null);

  const destinationMarker = useRef<Marker | null>(null);

  const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

  useDriverLocation({
    enabled: false,

    onLocationChange: (location) => {
      setDriverLocation(location);
    },
  });

  const drawDriverRoute = useCallback(
    (coordinates: [number, number][]) => {
      const map = mapRef.current;

      if (!map || !mapReady) {
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

      const source = map.getSource("driver-route") as GeoJSONSource | undefined;

      if (source) {
        source.setData(geojson);
        return;
      }

      map.addSource("driver-route", {
        type: "geojson",
        data: geojson,
      });

      if (!map.getLayer("driver-route")) {
        map.addLayer({
          id: "driver-route",
          type: "line",
          source: "driver-route",

          layout: {
            "line-cap": "round",
            "line-join": "round",
          },

          paint: {
            "line-color": "#111827",
            "line-width": 6,
            "line-opacity": 0.9,
          },
        });
      }
    },
    [mapReady],
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !MAPTILER_API_KEY) {
      return;
    }

    const map = new MapLibreMap({
      container: mapContainer.current,

      style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_API_KEY}`,

      center: [ride.pickupLongitude, ride.pickupLatitude],

      zoom: 13,
    });

    map.addControl(new NavigationControl(), "top-right");

    map.on("load", () => {
      setMapReady(true);

      if (!pickupMarker.current) {
        pickupMarker.current = new Marker({
          color: "#2563eb",
        })
          .setLngLat([ride.pickupLongitude, ride.pickupLatitude])
          .addTo(map);
      }

      if (!destinationMarker.current) {
        destinationMarker.current = new Marker({
          color: "#ef4444",
        })
          .setLngLat([ride.dropoffLongitude, ride.dropoffLatitude])
          .addTo(map);
      }

      const bounds = new LngLatBounds();

      bounds.extend([ride.pickupLongitude, ride.pickupLatitude]);

      bounds.extend([ride.dropoffLongitude, ride.dropoffLatitude]);

      if (driverLocation) {
        if (!driverMarker.current) {
          driverMarker.current = new Marker({
            color: "#10b981",
          })
            .setLngLat([driverLocation.longitude, driverLocation.latitude])
            .addTo(map);
        }

        bounds.extend([driverLocation.longitude, driverLocation.latitude]);
      }

      map.fitBounds(bounds, {
        padding: {
          top: 100,
          bottom: 280,
          left: 80,
          right: 80,
        },

        maxZoom: 14,

        duration: 800,
      });
    });

    map.on("error", (event) => {
      console.error("Driver map error:", event.error);
    });

    mapRef.current = map;

    return () => {
      setMapReady(false);

      driverMarker.current?.remove();
      pickupMarker.current?.remove();
      destinationMarker.current?.remove();

      driverMarker.current = null;
      pickupMarker.current = null;
      destinationMarker.current = null;

      if (map.getLayer("driver-route")) {
        map.removeLayer("driver-route");
      }

      if (map.getSource("driver-route")) {
        map.removeSource("driver-route");
      }

      map.remove();

      mapRef.current = null;
    };
  }, [
    MAPTILER_API_KEY,
    ride.pickupLatitude,
    ride.pickupLongitude,
    ride.dropoffLatitude,
    ride.dropoffLongitude,
  ]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !pickupMarker.current) {
      return;
    }

    pickupMarker.current.setLngLat([ride.pickupLongitude, ride.pickupLatitude]);
  }, [mapReady, ride.pickupLatitude, ride.pickupLongitude]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !destinationMarker.current) {
      return;
    }

    destinationMarker.current.setLngLat([
      ride.dropoffLongitude,
      ride.dropoffLatitude,
    ]);
  }, [mapReady, ride.dropoffLatitude, ride.dropoffLongitude]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !driverLocation) {
      return;
    }

    const position: [number, number] = [
      driverLocation.longitude,
      driverLocation.latitude,
    ];

    if (!driverMarker.current) {
      driverMarker.current = new Marker({
        color: "#10b981",
      })
        .setLngLat(position)
        .addTo(mapRef.current);
    } else {
      driverMarker.current.setLngLat(position);
    }
  }, [driverLocation, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !driverLocation) {
      return;
    }

    let cancelled = false;

    const fetchDriverRoute = async () => {
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${ride.pickupLongitude},${ride.pickupLatitude};` +
          `${ride.dropoffLongitude},${ride.dropoffLatitude}` +
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

        const coordinates = route?.geometry?.coordinates;

        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          console.error("Route coordinates missing");
          return;
        }

        drawDriverRoute(coordinates as [number, number][]);
      } catch (error) {
        if (!cancelled) {
          console.error("Driver route error:", error);
        }
      }
    };

    fetchDriverRoute();

    return () => {
      cancelled = true;
    };
  }, [
    mapReady,
    ride.pickupLatitude,
    ride.pickupLongitude,
    ride.dropoffLatitude,
    ride.dropoffLongitude,
    drawDriverRoute,
  ]);

  const handleNavigate = () => {
    if (!driverLocation) {
      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1` +
      `&origin=${driverLocation.latitude},${driverLocation.longitude}` +
      `&destination=${ride.pickupLatitude},${ride.pickupLongitude}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const completeRideMutation = useCompleteRide();
  const handleCompleteRide = () => {
    console.log('-------->',rideRequest?.ride_id)
    if (!Number(rideRequest?.ride_id)) {
      return;
    }

    completeRideMutation.mutate(
       Number(rideRequest?.ride_id),
      {
        onSuccess: () => {
          useDriverRideStore.getState().clearActiveRide();
        },

        onError: (error: Error) => {
          console.error("Failed to complete ride:", error);
        },
      },
    );
  };

  return (
    <main className="relative h-screen w-full overflow-hidden bg-slate-100">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

      <div className="absolute left-4 top-4 z-20 rounded-2xl bg-white px-4 py-3 shadow-xl">
        <p className="text-xs text-slate-400">Ride</p>

        <p className="text-lg font-bold">#{ride.id}</p>
      </div>

      <div className="absolute right-4 top-4 z-20 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-xl">
        DRIVER_ASSIGNED
      </div>

      <div
        // type="button"
        className="absolute right-5 bottom-5 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-xl"
      >
        <ProfileMenu />
      </div>
      <section className="absolute bottom-4 left-4 right-4 z-20 rounded-3xl bg-white p-5 shadow-2xl md:left-5 md:right-auto md:w-[440px]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <Car size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-400">Active Ride</p>

            <h1 className="text-xl font-bold">Ride #{ride.id}</h1>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">PICKUP</p>

            <p className="mt-1 text-sm font-semibold">
              {ride.pickupLatitude}, {ride.pickupLongitude}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">DESTINATION</p>

            <p className="mt-1 text-sm font-semibold">
              {ride.dropoffLatitude}, {ride.dropoffLongitude}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold"
          >
            <Phone size={17} />
            Call
          </button>

          <button
            type="button"
            onClick={handleNavigate}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 font-semibold text-white"
          >
            <Navigation size={17} />
            Navigate
          </button>
        </div>
        <button
          type="button"
          onClick={handleCompleteRide}
          disabled={completeRideMutation.isPending}
          className="mt-3 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {completeRideMutation.isPending ? "Completing..." : "Complete Ride"}
        </button>
      </section>
    </main>
  );
}
