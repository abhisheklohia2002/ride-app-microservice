import { createFileRoute } from "@tanstack/react-router";

import { OtpScreen } from "@/features/auth/OtpScreen";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verify your phone — RideX" },
      { name: "description", content: "Enter the 6-digit code we sent to confirm your number." },
      { property: "og:title", content: "Verify your phone — RideX" },
      { property: "og:description", content: "Enter the 6-digit code to confirm your number." },
    ],
  }),
  component: OtpScreen,
});
