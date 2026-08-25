import { create } from "zustand";
import type { RideRequest } from "../../http/driver/hooks/driver-socket";

interface DriverRideStore {
  rideRequest: RideRequest | null;

  setRideRequest: (
    rideRequest: RideRequest,
  ) => void;

  clearRideRequest: () => void;
}

export const useDriverRideStore =
  create<DriverRideStore>((set) => ({
    rideRequest: null,

    setRideRequest: (rideRequest) =>
      set({
        rideRequest,
      }),

    clearRideRequest: () =>
      set({
        rideRequest: null,
      }),
  }));