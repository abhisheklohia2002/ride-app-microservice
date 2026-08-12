import { createFileRoute } from "@tanstack/react-router";

import { ConfirmRideScreen } from "@/features/booking/ConfirmRideScreen";

export const Route = createFileRoute("/confirm-ride")({
  head: () => ({
    meta: [
      { title: "Choose your ride — RideX" },
      {
        name: "description",
        content: "Compare Bike, Auto, Go, Sedan, SUV and Luxury fares, apply a promo and book.",
      },
      { property: "og:title", content: "Choose your ride — RideX" },
      {
        property: "og:description",
        content: "Compare fares across categories, apply a promo and book instantly.",
      },
    ],
  }),
  component: ConfirmRideScreen,
});
