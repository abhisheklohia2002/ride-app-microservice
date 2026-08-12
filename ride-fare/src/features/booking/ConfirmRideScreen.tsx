import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { locationApi } from "@/api/location.api";
import { paymentApi } from "@/api/payment.api";
import { queryKeys } from "@/api/query-keys";
import { rideApi } from "@/api/ride.api";
import { BottomSheet } from "@/components/common/BottomSheet";
import { AppHeader } from "@/components/common/AppHeader";
import { Loader } from "@/components/common/Loader";
import { ErrorState } from "@/components/common/States";
import { MapCanvas } from "@/components/map/MapCanvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

import { PAYMENT_METHODS } from "@/constants";
import { cn } from "@/lib/utils";
import { useRideStore } from "@/store/ride.store";
import type { PaymentMethodId } from "@/types";
import { formatCurrency, formatDistance, formatDuration } from "@/utils/format";

export function ConfirmRideScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    pickup,
    destination,
    selectedCategory,
    setSelectedCategory,
    paymentMethod,
    setPaymentMethod,
    promoCode,
    setPromoCode,
    setActiveRide,
    setRideStatus,
  } = useRideStore();
  const [promoInput, setPromoInput] = useState(promoCode ?? "");
  const [isBottomSheet, setIsBottomSheet] = useState(true);

  useEffect(() => {
    if (!pickup || !destination) void navigate({ to: "/search" });
  }, [pickup, destination, navigate]);

  const routeQuery = useQuery({
    queryKey: queryKeys.locations.route(pickup?.id, destination?.id),
    queryFn: () => locationApi.routeEstimate({ pickup: pickup!, destination: destination! }),
    enabled: Boolean(pickup && destination),
  });

  const estimatesQuery = useQuery({
    queryKey: queryKeys.rides.estimates(pickup?.id, destination?.id),
    queryFn: () => rideApi.estimates({ pickup: pickup!, destination: destination! }),
    enabled: Boolean(pickup && destination),
  });

  useEffect(() => {
    if (!selectedCategory && estimatesQuery.data?.[2]) {
      setSelectedCategory(estimatesQuery.data[2].id);
    }
  }, [estimatesQuery.data, selectedCategory, setSelectedCategory]);

  const applyPromo = useMutation({
    mutationFn: () => paymentApi.validatePromo(promoInput.trim()),
    onSuccess: (promo) => {
      setPromoCode(promo.code);
      toast.success(`${promo.code} applied — ${promo.discountPercent}% off`);
    },
    onError: (error: Error) => toast.error(error.message || "Invalid promo code"),
  });

  const book = useMutation({
    mutationFn: () =>
      rideApi.create({
        pickup: pickup!,
        destination: destination!,
        category: selectedCategory ?? "go",
        paymentMethod,
        promoCode: promoCode ?? undefined,
      }),
    onSuccess: (ride) => {
      setActiveRide(ride.id);
      setRideStatus("searching");
      void queryClient.invalidateQueries({ queryKey: queryKeys.rides.all });
      void navigate({ to: "/finding-driver" });
    },
    onError: (error: Error) => toast.error(error.message || "Could not request your ride"),
  });

  const selected = estimatesQuery.data?.find((option) => option.id === selectedCategory);
  const toggleSheet = () => {
    setIsBottomSheet((prev) => !prev);
  };
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <MapCanvas
        className="absolute inset-x-0 top-0 h-[48vh] min-h-[300px]"
        polyline={routeQuery.data?.polyline ?? []}
        pickup={pickup?.coords}
        destination={destination?.coords}
      />
      <div className="relative z-30">
        <AppHeader
          title={destination?.name ?? "Choose a ride"}
          subtitle={
            routeQuery.data
              ? `${formatDistance(routeQuery.data.distanceKm)} · ${formatDuration(routeQuery.data.durationMinutes)}`
              : "Calculating route…"
          }
        />
      </div>

      <div onClick={toggleSheet} className="relative z-20 mt-auto">
        <motion.div
          initial={false}
          animate={{
            height: isBottomSheet ? "80vh" : "90px",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
        >
          <BottomSheet className="space-y-4 pb-8">
            <h2 className="text-sm font-semibold text-foreground">Choose a ride</h2>

            {estimatesQuery.isPending ? (
              <Loader className="py-8" label="Fetching fares" />
            ) : estimatesQuery.isError ? (
              <ErrorState onRetry={() => void estimatesQuery.refetch()} />
            ) : (
              <div className="no-scrollbar max-h-[38vh] space-y-2 overflow-y-auto">
                {estimatesQuery.data?.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedCategory(option.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      option.id === selectedCategory
                        ? "border-primary bg-primary/10"
                        : "border-border bg-elevated",
                    )}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-lg">
                      {option.id === "bike" ? "🏍" : option.id === "auto" ? "🛺" : "🚗"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                        {option.name}
                        <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                          <Users className="h-3 w-3" /> {option.seats}
                        </span>
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {option.etaMinutes} min away · {option.tagline}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="tabular font-display block text-[15px] font-bold text-foreground">
                        {formatCurrency(option.fare)}
                      </span>
                      {option.originalFare ? (
                        <span className="tabular block text-[11px] text-muted-foreground line-through">
                          {formatCurrency(option.originalFare)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as PaymentMethodId)}
              >
                <SelectTrigger className="h-13 flex-1 rounded-2xl border-border bg-elevated px-4 text-[14px] font-semibold">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.label} · {method.detail}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex h-13 flex-1 items-center gap-2 rounded-2xl border border-border bg-elevated px-3">
                <Ticket className="h-4 w-4 text-primary" />
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-foreground outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  type="button"
                  disabled={!promoInput.trim() || applyPromo.isPending}
                  onClick={() => applyPromo.mutate()}
                  className="text-xs font-bold text-primary disabled:text-muted-foreground"
                >
                  Apply
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!selected || book.isPending}
              onClick={() => book.mutate()}
              className="glow-primary h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-60"
            >
              {book.isPending
                ? "Requesting…"
                : selected
                  ? `Book ${selected.name} · ${formatCurrency(selected.fare)}`
                  : "Select a ride"}
            </button>
          </BottomSheet>
        </motion.div>
      </div>
    </div>
  );
}
