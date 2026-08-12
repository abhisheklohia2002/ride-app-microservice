import { createFileRoute } from "@tanstack/react-router";

import { LoginScreen } from "@/features/auth/LoginScreen";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — RideX" },
      { name: "description", content: "Sign in to RideX to book rides and track your captain live." },
      { property: "og:title", content: "Sign in — RideX" },
      { property: "og:description", content: "Sign in to book rides and track your captain live." },
    ],
  }),
  component: LoginScreen,
});
