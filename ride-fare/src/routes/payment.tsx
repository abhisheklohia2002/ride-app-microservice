import { createFileRoute } from "@tanstack/react-router";

import { PaymentScreen } from "@/features/payment/PaymentScreen";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Pay & rate your trip — RideX" },
      {
        name: "description",
        content: "Review your fare breakdown, add a tip, pay and rate your captain.",
      },
      { property: "og:title", content: "Pay & rate your trip — RideX" },
      {
        property: "og:description",
        content: "Review the fare breakdown, add a tip, pay and rate your captain.",
      },
    ],
  }),
  component: PaymentScreen,
});
