import { http } from "./api";
import type { Place, RouteEstimate } from "@/types";

export const locationApi = {
  autocomplete: (query: string) =>
    http.get<Place[]>(`/locations/autocomplete?q=${encodeURIComponent(query)}`),
  savedPlaces: () => http.get<Place[]>("/locations/saved"),
  savePlace: (place: Omit<Place, "id" | "category">) =>
    http.post<Place>("/locations/saved", { place }),
  deleteSavedPlace: (id: string) => http.delete<{ deleted: boolean }>(`/locations/saved/${id}`),
  recentPlaces: () => http.get<Place[]>("/locations/recent"),
  currentLocation: () => http.get<Place>("/locations/current"),
  routeEstimate: (payload: { pickup: Place; destination: Place }) =>
    http.post<RouteEstimate>("/locations/route", payload),
};
