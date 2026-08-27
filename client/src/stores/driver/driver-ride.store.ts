import { create } from "zustand";

import type { RideRequest } from "../../http/driver/hooks/driver-socket";

interface ActiveRide {
  id: number;
  driverId: number;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  status: string;
  passengerId?:number;
  passengerName?:string;
}

interface DriverRideStore {
  rideRequest: RideRequest | null;
  activeRide: ActiveRide | null;

  setRideRequest: (ride: RideRequest) => void;
  clearRideRequest: () => void;

  setActiveRide: (ride: ActiveRide) => void;
  clearActiveRide: () => void;
}

export const useDriverRideStore =
  create<DriverRideStore>((set) => ({
    rideRequest: null,

    activeRide: null,

    setRideRequest: (rideRequest) =>
      set({
        rideRequest,
      }),

    clearRideRequest: () =>
      set({
        rideRequest: null,
      }),

    setActiveRide: (ride) =>
      set({
        activeRide: ride,
      }),

    clearActiveRide: () =>
      set({
        activeRide: null,
      }),
  }));