import { create } from "zustand";

import type {
  Driver,
  PaymentMethodId,
  Place,
  RideCategoryId,
  RideStatus,
} from "@/types";

interface RideState {
  pickup: Place | null;
  destination: Place | null;

  selectedCategory: RideCategoryId | null;

  paymentMethod: PaymentMethodId;
  promoCode: string | null;

  activeRideId: string | null;
  rideStatus: RideStatus;

  driver: Driver | null;
  tip: number;

  setPickup: (place: Place | null) => void;
  setDestination: (place: Place | null) => void;
  clearDestination: () => void;

  swapEndpoints: () => void;

  setSelectedCategory: (
    category: RideCategoryId | null,
  ) => void;

  setPaymentMethod: (
    method: PaymentMethodId,
  ) => void;

  setPromoCode: (
    code: string | null,
  ) => void;

  setActiveRide: (
    rideId: string | null,
  ) => void;

  setRideStatus: (
    status: RideStatus,
  ) => void;

  setDriver: (
    driver: Driver | null,
  ) => void;

  setTip: (
    tip: number,
  ) => void;

  resetBooking: () => void;
}

export const useRideStore =
  create<RideState>()((set, get) => ({
    pickup: null,
    destination: null,

    selectedCategory: null,

    paymentMethod: "upi",
    promoCode: null,

    activeRideId: null,
    rideStatus: "idle",

    driver: null,
    tip: 0,

    setPickup: (place) =>
      set({
        pickup: place,
      }),

    setDestination: (place) =>
      set({
        destination: place,
      }),

    clearDestination: () =>
      set({
        destination: null,
      }),

    swapEndpoints: () => {
      const {
        pickup,
        destination,
      } = get();

      set({
        pickup: destination,
        destination: pickup,
      });
    },

    setSelectedCategory: (
      category,
    ) =>
      set({
        selectedCategory: category,
      }),

    setPaymentMethod: (
      method,
    ) =>
      set({
        paymentMethod: method,
      }),

    setPromoCode: (
      code,
    ) =>
      set({
        promoCode: code,
      }),

    setActiveRide: (
      rideId,
    ) =>
      set({
        activeRideId: rideId,
      }),

    setRideStatus: (
      status,
    ) =>
      set({
        rideStatus: status,
      }),

    setDriver: (
      driver,
    ) =>
      set({
        driver,
      }),

    setTip: (
      tip,
    ) =>
      set({
        tip,
      }),

    resetBooking: () =>
      set({
        destination: null,
        selectedCategory: null,
        promoCode: null,

        activeRideId: null,
        rideStatus: "idle",

        driver: null,
        tip: 0,
      }),
  }));