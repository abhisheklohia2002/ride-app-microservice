import { createFileRoute } from "@tanstack/react-router";

import { FindingDriverScreen } from "@/features/booking/FindingDriverScreen";

export const Route = createFileRoute("/finding-driver")({
  head: () => ({
    meta: [
      { title: "Finding your captain — RideX" },
      { name: "description", content: "We are matching you with the nearest available captain." },
      { property: "og:title", content: "Finding your captain — RideX" },
      { property: "og:description", content: "Matching you with the nearest available captain." },
    ],
  }),
  component: FindingDriverScreen,
});
