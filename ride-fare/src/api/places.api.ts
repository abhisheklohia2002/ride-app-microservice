
const GEOAPIFY_BASE_URL =
  "https://api.geoapify.com/v1";

const GEOAPIFY_API_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY;

if (!GEOAPIFY_API_KEY) {
  console.warn(
    "VITE_GEOAPIFY_API_KEY is not configured",
  );
}

export interface PlacePrediction {
  placeId: string;
  name: string;
  description: string;

  lat: number;
  lng: number;

  category?: string;
}

interface GeoapifyResult {
  place_id?: string;

  name?: string;

  formatted?: string;

  address_line1?: string;

  address_line2?: string;

  city?: string;

  state?: string;

  country?: string;

  country_code?: string;

  lat: number;

  lon: number;

  result_type?: string;

  category?: string;

  rank?: {
    confidence?: number;
    confidence_city_level?: number;
    confidence_street_level?: number;
    confidence_building_level?: number;
  };

  distance?: number;
}


export interface CurrentLocation {
  lat: number;
  lng: number;
}

export interface ReverseGeocodeResult {
  lat: number;
  lon: number;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
}
interface GeoapifyAutocompleteResponse {
  results?: GeoapifyResult[];
}

export async function autocompletePlaces(
  input: string,
  pickup?: {
    lat: number;
    lng: number;
  },
): Promise<PlacePrediction[]> {
  const value = input.trim();

  if (!value) {
    return [];
  }

  if (!GEOAPIFY_API_KEY) {
    throw new Error(
      "Geoapify API key is not configured",
    );
  }

  const params = new URLSearchParams();

  params.set("text", value);

  params.set("format", "json");

  params.set("limit", "8");

  params.set("lang", "en");


  params.set(
    "filter",
    "countrycode:in",
  );

  if (pickup) {
    params.set(
      "bias",
      `proximity:${pickup.lng},${pickup.lat}`,
    );
  }

  params.set(
    "apiKey",
    GEOAPIFY_API_KEY,
  );

  const response = await fetch(
    `${GEOAPIFY_BASE_URL}/geocode/autocomplete?${params.toString()}`,
  );

  if (!response.ok) {
    let message =
      "Unable to search locations";

    try {
      const error =
        (await response.json()) as {
          message?: string;
        };

      if (error.message) {
        message = error.message;
      }
    } catch {
     
    }

    throw new Error(message);
  }

  const data =
    (await response.json()) as GeoapifyAutocompleteResponse;

  return (
  data.results
    ?.filter(
      (result) =>
        Number.isFinite(result.lat) &&
        Number.isFinite(result.lon),
    )
    .map((result) => ({
      placeId:
        result.place_id ??
        `${result.lat}-${result.lon}`,

      name:
        result.name ??
        result.address_line1 ??
        result.formatted ??
        "Unknown place",

      description:
        result.formatted ??
        [
          result.address_line2,
          result.city,
          result.state,
        ]
          .filter(Boolean)
          .join(", "),

      lat: result.lat,
      lng: result.lon,

      category:
        result.category ??
        "place",
    })) ?? []
);
}


export async function reverseGeocode(
  location: CurrentLocation,
): Promise<ReverseGeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lng),
    format: "json",
    apiKey: GEOAPIFY_API_KEY,
  });

  const response = await fetch(
    `${GEOAPIFY_BASE_URL}/geocode/reverse?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      "Unable to determine current location",
    );
  }

  const data = await response.json();

  return data.results?.[0] ?? null;
}