const GOOGLE_PLACES_URL = "https://places.googleapis.com/v1";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface PlacePrediction {
  placeId: string;
  name: string;
  description: string;
}

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text?: {
        text?: string;
      };
      structuredFormat?: {
        mainText?: {
          text?: string;
        };
        secondaryText?: {
          text?: string;
        };
      };
    };
  }>;
}

interface PlaceDetailsResponse {
  id: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export async function autocompletePlaces(input: string, sessionToken: string) {
  if (!input.trim()) {
    return [];
  }

  const response = await fetch(`${GOOGLE_PLACES_URL}/places:autocomplete`, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "X-Goog-Api-Key": API_KEY,

      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId," +
        "suggestions.placePrediction.text," +
        "suggestions.placePrediction.structuredFormat",
    },

    body: JSON.stringify({
      input,

      sessionToken,

      regionCode: "IN",

      includedRegionCodes: ["IN"],

      locationBias: {
        circle: {
          center: {
            latitude: pickup.coords.lat,
            longitude: pickup.coords.lng,
          },
          radius: 50000,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(error || "Failed to search places");
  }

  const data = (await response.json()) as AutocompleteResponse;

  return (
    data.suggestions
      ?.filter((suggestion) => suggestion.placePrediction)
      .map((suggestion) => {
        const prediction = suggestion.placePrediction!;

        return {
          placeId: prediction.placeId,

          name: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "",

          description: prediction.structuredFormat?.secondaryText?.text ?? "",
        };
      }) ?? []
  );
}

export async function getPlaceDetails(placeId: string, sessionToken: string) {
  const response = await fetch(`${GOOGLE_PLACES_URL}/places/${placeId}`, {
    headers: {
      "Content-Type": "application/json",

      "X-Goog-Api-Key": API_KEY,

      "X-Goog-FieldMask": "id,displayName,formattedAddress,location",

      "X-Goog-Session-Token": sessionToken,
    },
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(error || "Failed to get place details");
  }

  return (await response.json()) as PlaceDetailsResponse;
}
