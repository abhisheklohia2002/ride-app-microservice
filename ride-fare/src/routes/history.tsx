import { createFileRoute } from "@tanstack/react-router";

import { HistoryScreen } from "@/features/history/HistoryScreen";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Your trips — RideX" },
      { name: "description", content: "Every RideX trip with routes, fares and receipts." },
      { property: "og:title", content: "Your trips — RideX" },
      { property: "og:description", content: "Every trip with routes, fares and receipts." },
    ],
  }),
  component: HistoryScreen,
});
