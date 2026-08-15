import { APIProvider, Map, Marker, Polyline, useMap } from "@vis.gl/react-google-maps";

import { useEffect, useState } from "react";

import { getRoute } from "@/api/route.api";
import { cn } from "@/lib/utils";
import type { LatLng } from "@/types";

interface MapVehicle {
  id: string;
  coords: LatLng;
  kind?: "car" | "bike" | "auto";
}

interface MapCanvasProps {
  pickup?: LatLng;
  destination?: LatLng;
  vehicles?: MapVehicle[];
  focus?: LatLng;
  className?: string;
}

const DEFAULT_CENTER: LatLng = {
  lat: 28.6139,
  lng: 77.209,
};

/**
 * Automatically moves the camera
 * to show the complete route.
 */
function MapViewport({
  pickup,
  destination,
}: {
  pickup: LatLng | undefined;
  destination: LatLng | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !pickup || !destination) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    bounds.extend(pickup);
    bounds.extend(destination);

    /*
     * Extra bottom padding because
     * the ride bottom sheet covers
     * the lower part of the map.
     */
    map.fitBounds(bounds, {
      top: 100,
      right: 50,
      bottom: 350,
      left: 50,
    });
  }, [map, pickup, destination]);

  return null;
}

/**
 * Calculates and displays
 * pickup → destination route.
 */
function RouteLayer({
  pickup,
  destination,
}: {
  pickup: LatLng | undefined;
  destination: LatLng | undefined;
}) {
  const [geometry, setGeometry] = useState<LatLng[]>([]);

  useEffect(() => {
    if (!pickup || !destination) {
      setGeometry([]);
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      try {
        const result = await getRoute(pickup, destination);

        if (cancelled) {
          return;
        }

        setGeometry(result.geometry);

        console.log("Route distance:", result.distanceKm, "km");

        console.log("Route duration:", result.durationMinutes, "minutes");
      } catch (error) {
        console.error("Route calculation failed:", error);

        if (!cancelled) {
          setGeometry([]);
        }
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [pickup, destination]);

  if (geometry.length === 0) {
    return null;
  }

  return (
    <Polyline
      path={geometry}
      strokeColor="#6ce15f"
      strokeOpacity={0.9}
      strokeWeight={6}
      geodesic
      zIndex={10}
    />
  );
}
const RIDE_MAP_STYLE: google.maps.MapTypeStyle[] = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [
      { color: "#f5f5f5" },
    ],
  },

  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#6b7280" },
    ],
  },

  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [
      { color: "#f5f5f5" },
    ],
  },

  // Roads
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      { color: "#ffffff" },
    ],
  },

  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [
      { color: "#e5e7eb" },
    ],
  },

  // Major roads
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      { color: "#e5e7eb" },
    ],
  },

  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [
      { color: "#d1d5db" },
    ],
  },

  // Local road labels
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      { color: "#9ca3af" },
    ],
  },

  // Parks
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      { color: "#e8f3e8" },
    ],
  },

  // Water
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      { color: "#dceff7" },
    ],
  },

  // Reduce business POIs
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [
      { visibility: "off" },
    ],
  },

  // Reduce general POIs
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [
      { visibility: "off" },
    ],
  },

  // Transit
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [
      { visibility: "off" },
    ],
  },
];
export function MapCanvas({
  pickup,
  destination,
  vehicles = [],
  focus,
  className,
}: MapCanvasProps) {
  const center = focus ?? pickup ?? destination ?? DEFAULT_CENTER;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
         defaultCenter={center}
  defaultZoom={15}
  gestureHandling="greedy"
  disableDefaultUI
  styles={RIDE_MAP_STYLE}
        >
          {/* Pickup */}

          {pickup && <Marker position={pickup} title="Pickup" />}

          {/* Destination */}

          {destination && <Marker position={destination} title="Destination" />}

          {/* Route */}

          <RouteLayer pickup={pickup} destination={destination} />

          {/* Viewport */}

          <MapViewport pickup={pickup} destination={destination} />

          {/* Nearby drivers */}

          {vehicles.map((vehicle) => (
            <Marker key={vehicle.id} position={vehicle.coords} title={vehicle.kind ?? "Driver"} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
