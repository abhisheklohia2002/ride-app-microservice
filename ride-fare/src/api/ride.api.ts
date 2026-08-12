import { http } from "./api";
import type {
  Driver,
  Paginated,
  PaymentMethodId,
  Place,
  Ride,
  RideCategoryId,
  RideOption,
  RideStatus,
} from "@/types";

export interface CreateRidePayload {
  pickup: Place;
  destination: Place;
  category: RideCategoryId;
  paymentMethod: PaymentMethodId;
  promoCode?: string | undefined;
}

export const rideApi = {
  estimates: (payload: { pickup: Place; destination: Place }) =>
    http.post<RideOption[]>("/rides/estimates", payload),
  nearbyDrivers: (pickupId: string) =>
    http.get<Driver[]>(`/rides/nearby-drivers?pickupId=${encodeURIComponent(pickupId)}`),
  create: (payload: CreateRidePayload) => http.post<Ride>("/rides", payload),
  active: () => http.get<Ride | null>("/rides/active"),
  byId: (id: string) => http.get<Ride>(`/rides/${id}`),
  assignDriver: (id: string) => http.post<Ride>(`/rides/${id}/assign`),
  updateStatus: (id: string, status: RideStatus) =>
    http.patch<Ride>(`/rides/${id}/status`, { status }),
  cancel: (id: string, reason: string) =>
    http.post<{ ride: Ride; reason: string }>(`/rides/${id}/cancel`, { reason }),
  history: (page: number, pageSize = 4) =>
    http.get<Paginated<Ride>>(`/rides/history?page=${page}&pageSize=${pageSize}`),
};
