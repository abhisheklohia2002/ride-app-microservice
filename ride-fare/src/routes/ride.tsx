import { createFileRoute } from "@tanstack/react-router";

import { RideTrackingScreen } from "@/features/ride/RideTrackingScreen";

export const Route = createFileRoute("/ride")({
  head: () => ({
    meta: [
      { title: "Live ride tracking — RideX" },
      {
        name: "description",
        content: "Track your captain on the map, share the start OTP and follow the trip live.",
      },
      { property: "og:title", content: "Live ride tracking — RideX" },
      {
        property: "og:description",
        content: "Track your captain live, share the start OTP and follow the trip.",
      },
    ],
  }),
  component: RideTrackingScreen,
});
