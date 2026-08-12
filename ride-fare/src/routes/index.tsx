import { createFileRoute } from "@tanstack/react-router";

import { HomeScreen } from "@/features/home/HomeScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RideX — Book a ride in seconds" },
      {
        name: "description",
        content:
          "RideX is a premium ride-booking experience: pick a destination, compare Bike, Auto, Go, Sedan, SUV and Luxury fares, then track your captain live.",
      },
      { property: "og:title", content: "RideX — Book a ride in seconds" },
      {
        property: "og:description",
        content:
          "Compare fares across Bike, Auto, Go, Sedan, SUV and Luxury, then track your captain live on the map.",
      },
    ],
  }),
  component: HomeScreen,
});
