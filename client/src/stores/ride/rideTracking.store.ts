import { create } from "zustand";

interface AssignedDriver {
  id: number;
  name: string;
}

interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface RideTrackingState {
  assignedDriver: AssignedDriver | null;
  driverLocation: DriverLocation | null;

  setAssignedDriver: (
    driver: AssignedDriver,
  ) => void;

  setDriverLocation: (
    location: DriverLocation,
  ) => void;

  clearRideTracking: () => void;
}

export const useRideTrackingStore =
  create<RideTrackingState>((set) => ({
    assignedDriver: null,
    driverLocation: null,

    setAssignedDriver: (driver) =>
      set({
        assignedDriver: driver,
      }),

    setDriverLocation: (location) =>
      set({
        driverLocation: location,
      }),

    clearRideTracking: () =>
      set({
        assignedDriver: null,
        driverLocation: null,
      }),
  }));