import type { LatLng } from "@/types";

const OSRM_URL =
  "https://router.project-osrm.org";

interface OSRMResponse {
  code: string;

  routes: Array<{
    distance: number;

    duration: number;

    geometry: {
      type: "LineString";

      coordinates: [
        number,
        number,
      ][];
    };
  }>;
}

export interface RouteResult {
  distanceKm: number;

  durationMinutes: number;

  geometry: LatLng[];
}

export async function getRoute(
  pickup: LatLng,
  destination: LatLng,
): Promise<RouteResult> {
  const coordinates = [
    `${pickup.lng},${pickup.lat}`,
    `${destination.lng},${destination.lat}`,
  ].join(";");

  const url =
    `${OSRM_URL}/route/v1/driving/${coordinates}` +
    `?overview=full&geometries=geojson`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Failed to calculate route",
    );
  }

  const data =
    (await response.json()) as OSRMResponse;

  if (
    data.code !== "Ok" ||
    data.routes.length === 0
  ) {
    throw new Error(
      "No route found",
    );
  }

  const route =
    data.routes[0];

  return {
    distanceKm:
      route.distance / 1000,

    durationMinutes:
      Math.ceil(
        route.duration / 60,
      ),

    geometry:
      route.geometry.coordinates.map(
        ([lng, lat]) => ({
          lat,
          lng,
        }),
      ),
  };
}