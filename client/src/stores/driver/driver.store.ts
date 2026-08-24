import { create } from "zustand";

interface DriverState {
  isOnline: boolean;

  setOnline: () => void;

  setOffline: () => void;
}

export const useDriverStore =
  create<DriverState>((set) => ({
    isOnline: false,

    setOnline: () =>
      set({
        isOnline: true,
      }),

    setOffline: () =>
      set({
        isOnline: false,
      }),
  }));