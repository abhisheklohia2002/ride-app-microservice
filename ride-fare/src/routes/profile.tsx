import { createFileRoute } from "@tanstack/react-router";

import { ProfileScreen } from "@/features/profile/ProfileScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — RideX" },
      {
        name: "description",
        content: "Manage your RideX account, notification preferences and safety settings.",
      },
      { property: "og:title", content: "Your profile — RideX" },
      {
        property: "og:description",
        content: "Manage your account, notifications and safety settings.",
      },
    ],
  }),
  component: ProfileScreen,
});
