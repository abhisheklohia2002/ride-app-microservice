import axios from "axios";

const MAPTILER_API_KEY =
  import.meta.env.VITE_MAPTILER_API_KEY;

const MAPTILER_BASE_URL =
  "https://api.maptiler.com";

export type MapLocation = {
  latitude: number;
  longitude: number;
};

export type GeocodingResult = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};

type MapTilerFeature = {
  id: string;
  type: string;

  geometry: {
    type: string;
    coordinates: [
      number,
      number,
    ];
  };

  properties?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };

  place_name?: string;
};


class MapTilerService {
  private readonly apiKey =
    MAPTILER_API_KEY;

  /**
   * Search locations
   */
  async searchLocation(
    query: string,
    proximity?: MapLocation,
  ): Promise<GeocodingResult[]> {
    if (!query.trim()) {
      return [];
    }

    const params: Record<
      string,
      string | number
    > = {
      key: this.apiKey,
      language: "en",
      limit: 5,
    };

    if (proximity) {
      params.proximity =
        `${proximity.longitude},${proximity.latitude}`;
    }

    const response =
      await axios.get(
        `${MAPTILER_BASE_URL}/geocoding/${encodeURIComponent(query)}.json`,
        {
          params,
        },
      );

    const features =
      response.data
        ?.features ?? [];

    return features.map(
      (feature: MapTilerFeature) => {
        const [
          longitude,
          latitude,
        ] =
          feature.geometry
            .coordinates;

        return {
          id: feature.id,
          address:
            feature.place_name ??
            feature.properties
              ?.name ??
            "Unknown location",
          latitude,
          longitude,
        };
      },
    );
  }


  /**
   * Get route between two locations
   */
  async getRoute(
    pickup: MapLocation,
    destination: MapLocation,
  ) {
    const coordinates =
      `${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}`;

    const response =
      await axios.get(
        `${MAPTILER_BASE_URL}/routing/${coordinates}`,
        {
          params: {
            key: this.apiKey,
            geometries:
              "geojson",
            overview:
              "full",
          },
        },
      );

    return response.data;
  }
}


export const mapTilerService =
  new MapTilerService();