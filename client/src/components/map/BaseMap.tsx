import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

interface BaseMapProps {
  latitude: number;
  longitude: number;
}

export default function BaseMap({
  latitude,
  longitude,
}: BaseMapProps) {
  const mapContainer =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (
      !mapContainer.current ||
      mapRef.current
    ) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://demotiles.maplibre.org/style.json",
      center: [
        longitude,
        latitude,
      ],
      zoom: 13,
    });

    new maplibregl.Marker()
      .setLngLat([
        longitude,
        latitude,
      ])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainer}
      className="h-full w-full"
    />
  );
}