import { createFileRoute } from "@tanstack/react-router";

import { SignupScreen } from "@/features/auth/SignupScreen";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your RideX account" },
      {
        name: "description",
        content: "Sign up for RideX in seconds and start booking bikes, autos, sedans and SUVs.",
      },
      { property: "og:title", content: "Create your RideX account" },
      {
        property: "og:description",
        content: "Sign up in seconds and start booking bikes, autos, sedans and SUVs.",
      },
    ],
  }),
  component: SignupScreen,
});
