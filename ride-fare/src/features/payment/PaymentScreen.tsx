import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { paymentApi } from "@/api/payment.api";
import { queryKeys } from "@/api/query-keys";
import { rideApi } from "@/api/ride.api";
import { AppHeader } from "@/components/common/AppHeader";
import { FullScreenLoader } from "@/components/common/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS } from "@/constants";
import { cn } from "@/lib/utils";
import { useRideStore } from "@/store/ride.store";
import type { PaymentMethodId } from "@/types";
import { formatCurrency, formatDistance, formatDuration } from "@/utils/format";

const TIPS = [0, 10, 20, 30, 50];

export function PaymentScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeRideId, paymentMethod, setPaymentMethod, tip, setTip, resetBooking } =
    useRideStore();
  const [rating, setRating] = useState(5);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!activeRideId) void navigate({ to: "/" });
  }, [activeRideId, navigate]);

  const rideQuery = useQuery({
    queryKey: queryKeys.rides.detail(activeRideId ?? "none"),
    queryFn: () => rideApi.byId(activeRideId!),
    enabled: Boolean(activeRideId),
  });

  const pay = useMutation({
    mutationFn: () => paymentApi.pay({ rideId: activeRideId!, method: paymentMethod, tip }),
    onSuccess: () => {
      setPaid(true);
      void queryClient.invalidateQueries({ queryKey: queryKeys.rides.all });
      toast.success("Payment successful");
    },
    onError: (error: Error) => toast.error(error.message || "Payment failed"),
  });

  const ride = rideQuery.data;
  if (!ride) return <FullScreenLoader label="Loading receipt" />;

  const total = ride.fareBreakdown.total + (paid ? 0 : tip);
  const rows = [
    { label: "Base fare", value: ride.fareBreakdown.base },
    { label: "Distance", value: ride.fareBreakdown.distance },
    { label: "Time", value: ride.fareBreakdown.time },
    { label: "Surge", value: ride.fareBreakdown.surge },
    { label: "Taxes", value: ride.fareBreakdown.taxes },
    { label: "Discount", value: -ride.fareBreakdown.discount },
    { label: "Tip", value: paid ? ride.fareBreakdown.tip : tip },
  ].filter((row) => row.value !== 0);

  return (
    <div className="min-h-screen bg-background pb-12">
      <AppHeader title={paid ? "Receipt" : "Pay for your trip"} subtitle={`Trip ${ride.code}`} />

      <div className="space-y-4 px-5 pt-5">
        <div className="rounded-3xl border border-border bg-elevated p-5 text-center">
          {paid ? (
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          ) : null}
          <p className="mt-2 text-[13px] text-muted-foreground">
            {paid ? "Paid with" : "Total payable"}{" "}
            {paid ? PAYMENT_METHODS.find((m) => m.id === ride.paymentMethod)?.label : ""}
          </p>
          <p className="tabular font-display mt-1 text-4xl font-bold text-foreground">
            {formatCurrency(total)}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {formatDistance(ride.route.distanceKm)} · {formatDuration(ride.route.durationMinutes)} ·{" "}
            {ride.categoryName}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-elevated p-4">
          <h2 className="text-sm font-semibold text-foreground">Fare breakdown</h2>
          <div className="mt-3 space-y-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between text-[14px]">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="tabular font-semibold text-foreground">
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!paid ? (
          <>
            <div className="rounded-3xl border border-border bg-elevated p-4">
              <h2 className="text-sm font-semibold text-foreground">Add a tip</h2>
              <div className="mt-3 flex gap-2">
                {TIPS.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTip(amount)}
                    className={cn(
                      "tabular h-11 flex-1 rounded-2xl border text-[14px] font-semibold",
                      amount === tip
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground",
                    )}
                  >
                    {amount === 0 ? "None" : formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>

            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethodId)}
            >
              <SelectTrigger className="h-14 w-full rounded-2xl border-border bg-elevated px-4 text-[15px] font-semibold">
                <SelectValue placeholder="Payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.label} · {method.detail}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              type="button"
              disabled={pay.isPending}
              onClick={() => pay.mutate()}
              className="glow-primary h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-60"
            >
              {pay.isPending ? "Processing…" : `Pay ${formatCurrency(total)}`}
            </button>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-border bg-elevated p-4">
              <h2 className="text-sm font-semibold text-foreground">
                Rate {ride.driver?.name ?? "your captain"}
              </h2>
              <div className="mt-3 flex justify-between">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star`}
                    onClick={() => setRating(value)}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        value <= rating ? "fill-primary text-primary" : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                toast.success(`Thanks for rating ${rating} stars`);
                resetBooking();
                void navigate({ to: "/" });
              }}
              className="glow-primary h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99]"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
