import { create } from "zustand";

type RideStatus =
  | "REQUESTED"
  | "SEARCHING_DRIVER"
  | "DRIVER_ASSIGNED"
  | "DRIVER_ARRIVING"
  | "DRIVER_ARRIVED"
  | "TRIP_STARTED"
  | "TRIP_COMPLETED"
  | "CANCELLED";

interface RideState {
  rideId: number | null;
  status: RideStatus | null;

  setRide: (
    rideId: number,
    status: RideStatus,
  ) => void;

  setStatus: (
    status: RideStatus,
  ) => void;

  clearRide: () => void;
}

export const useRideStore =
  create<RideState>((set) => ({
    rideId: null,
    status: null,

    setRide: (rideId, status) =>
      set({
        rideId,
        status,
      }),

    setStatus: (status) =>
      set({
        status,
      }),

    clearRide: () =>
      set({
        rideId: null,
        status: null,
      }),
  }));