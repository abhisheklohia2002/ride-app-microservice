import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

import { cn } from "@/lib/utils";
import type { LatLng } from "@/types";

export interface MapVehicle {
  id: string;
  coords: LatLng;
  kind?: "car" | "bike" | "auto";
}

interface MapCanvasProps {
  polyline?: LatLng[];
  pickup?: LatLng;
  destination?: LatLng;
  vehicles?: MapVehicle[];
  focus?: LatLng;
  className?: string;
  animateRoute?: boolean;
  showRadar?: boolean;
}

const DEFAULT_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
};

export function MapCanvas({
  polyline = [],
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
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="RIDE_APP_MAP"
        >
          {/* Pickup */}

          {pickup && <Marker position={pickup} title="Pickup" />}

          {/* Destination */}

          {destination && <Marker position={destination} title="Destination" />}

          {/* Nearby drivers */}

          {vehicles.map((vehicle) => (
            <Marker key={vehicle.id} position={vehicle.coords} title={vehicle.kind ?? "Driver"} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
