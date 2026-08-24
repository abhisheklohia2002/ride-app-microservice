import { setOptions } from "@googlemaps/js-api-loader";

let initialized = false;

export function initializeGoogleMaps() {
  if (initialized) {
    return;
  }

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "VITE_GOOGLE_MAPS_API_KEY is missing",
    );
  }

  setOptions({
    key: apiKey,
    v: "weekly",
  });

  initialized = true;
}