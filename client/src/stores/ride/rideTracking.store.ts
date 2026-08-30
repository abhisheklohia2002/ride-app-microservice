import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AssignedDriver {
  id: number;
  name: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface ActiveRide {
  id: number;
  passengerId: number;
  driverId: number | null;
  status: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
}

interface RideTrackingState {
  activeRide: ActiveRide | null;
  assignedDriver: AssignedDriver | null;
  driverLocation: DriverLocation | null;
  isSearchingDriver: boolean;
  searchStartedAt: number | null;

  setActiveRide: (ride: ActiveRide) => void;

  setAssignedDriver: (
    driver: AssignedDriver | null,
  ) => void;

  setDriverLocation: (
    location: DriverLocation,
  ) => void;

  startDriverSearch: () => void;

  stopDriverSearch: () => void;

  clearRideTracking: () => void;
}

export const useRideTrackingStore =
  create<RideTrackingState>()(
    persist(
      (set) => ({
        activeRide: null,
        assignedDriver: null,
        driverLocation: null,
        isSearchingDriver: false,
        searchStartedAt: null,

        setActiveRide: (activeRide) =>
          set({
            activeRide,
          }),

        setAssignedDriver: (assignedDriver) =>
          set({
            assignedDriver,
            isSearchingDriver: false,
            searchStartedAt: null,
          }),

        setDriverLocation: (driverLocation) =>
          set({
            driverLocation,
          }),

        startDriverSearch: () =>
          set({
            isSearchingDriver: true,
            searchStartedAt: Date.now(),
          }),

        stopDriverSearch: () =>
          set({
            isSearchingDriver: false,
            searchStartedAt: null,
          }),

        clearRideTracking: () =>
          set({
            activeRide: null,
            assignedDriver: null,
            driverLocation: null,
            isSearchingDriver: false,
            searchStartedAt: null,
          }),
      }),
      {
        name: "ride-tracking",
      },
    ),
  );