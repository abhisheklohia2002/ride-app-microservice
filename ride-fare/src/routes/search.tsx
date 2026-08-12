import { createFileRoute } from "@tanstack/react-router";

import { SearchScreen } from "@/features/search/SearchScreen";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Set pickup and drop — RideX" },
      {
        name: "description",
        content: "Search saved places, recent trips and landmarks to plan your RideX route.",
      },
      { property: "og:title", content: "Set pickup and drop — RideX" },
      {
        property: "og:description",
        content: "Search saved places, recent trips and landmarks to plan your route.",
      },
    ],
  }),
  component: SearchScreen,
});
