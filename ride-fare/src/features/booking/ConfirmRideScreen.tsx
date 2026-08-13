import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
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

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);

  /*
   * -------------------------------------------------------
   * Redirect if pickup/destination are missing
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!pickup || !destination) {
      void navigate({
        to: "/search",
      });
    }
  }, [pickup, destination, navigate]);

  /*
   * -------------------------------------------------------
   * Route
   * -------------------------------------------------------
   */

  const routeQuery = useQuery({
    queryKey: queryKeys.locations.route(pickup?.id, destination?.id),

    queryFn: () =>
      locationApi.routeEstimate({
        pickup: pickup!,
        destination: destination!,
      }),

    enabled: Boolean(pickup && destination),
  });

  /*
   * -------------------------------------------------------
   * Ride estimates
   * -------------------------------------------------------
   */

  const estimatesQuery = useQuery({
    queryKey: queryKeys.rides.estimates(pickup?.id, destination?.id),

    queryFn: () =>
      rideApi.estimates({
        pickup: pickup!,
        destination: destination!,
      }),

    enabled: Boolean(pickup && destination),
  });

  /*
   * -------------------------------------------------------
   * Default selected ride
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!selectedCategory && estimatesQuery.data?.[2]) {
      setSelectedCategory(estimatesQuery.data[2].id);
    }
  }, [estimatesQuery.data, selectedCategory, setSelectedCategory]);

  /*
   * -------------------------------------------------------
   * Promo
   * -------------------------------------------------------
   */

  const applyPromo = useMutation({
    mutationFn: () => paymentApi.validatePromo(promoInput.trim()),

    onSuccess: (promo) => {
      setPromoCode(promo.code);

      toast.success(`${promo.code} applied — ${promo.discountPercent}% off`);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Invalid promo code");
    },
  });

  /*
   * -------------------------------------------------------
   * Book ride
   * -------------------------------------------------------
   */

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

      void queryClient.invalidateQueries({
        queryKey: queryKeys.rides.all,
      });

      void navigate({
        to: "/finding-driver",
      });
    },

    onError: (error: Error) => {
      toast.error(error.message || "Could not request your ride");
    },
  });

  /*
   * -------------------------------------------------------
   * Selected ride
   * -------------------------------------------------------
   */

  const selected = estimatesQuery.data?.find((option) => option.id === selectedCategory);

  /*
   * -------------------------------------------------------
   * Bottom sheet controls
   * -------------------------------------------------------
   */

  const toggleBottomSheet = () => {
    setIsBottomSheetOpen((previous) => !previous);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;

    /*
     * Swipe UP
     */
    if (offsetY < -50 || velocityY < -500) {
      setIsBottomSheetOpen(true);
      return;
    }

    /*
     * Swipe DOWN
     */
    if (offsetY > 50 || velocityY > 500) {
      setIsBottomSheetOpen(false);
    }
  };

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      {/* =====================================================
          MAP
      ====================================================== */}

      <MapCanvas
        className="
          absolute
          inset-0
          h-full
          w-full
        "
        polyline={routeQuery.data?.polyline ?? []}
        pickup={pickup?.coords}
        destination={destination?.coords}
      />

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="relative z-40">
        <AppHeader
          title={destination?.name ?? "Choose a ride"}
          subtitle={
            routeQuery.data
              ? `${formatDistance(routeQuery.data.distanceKm)} · ${formatDuration(
                  routeQuery.data.durationMinutes,
                )}`
              : "Calculating route…"
          }
        />
      </div>

      {/* =====================================================
          BOTTOM SHEET
      ====================================================== */}

      <motion.div
        className="
          fixed
          inset-x-0
          bottom-0
          z-30
          overflow-hidden
          rounded-t-[28px]
          border
          border-border
          bg-background
          shadow-[0_-12px_45px_rgba(0,0,0,0.12)]
        "
        initial={false}
        animate={{
          height: isBottomSheetOpen ? "calc(100dvh - 175px)" : "96px",
        }}
        transition={{
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {/* =================================================
            DRAG HANDLE
        ================================================== */}

        <motion.div
          className="
            flex
            h-10
            w-full
            touch-none
            items-center
            justify-center
            cursor-grab
            active:cursor-grabbing
          "
          drag="y"
          dragConstraints={{
            top: 0,
            bottom: 0,
          }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          onTap={toggleBottomSheet}
        >
          <div
            className="
              h-1.5
              w-12
              rounded-full
              bg-muted-foreground/30
            "
          />
        </motion.div>

        {/* =================================================
            SHEET CONTENT
        ================================================== */}

        <div
          className={cn(
            "h-[calc(100%-40px)] overflow-y-auto overscroll-contain px-5 pb-6",
            "transition-opacity duration-200",
            isBottomSheetOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {/* =================================================
              TITLE
          ================================================= */}

          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">Choose a ride</h2>
          </div>

          {/* =================================================
              RIDE OPTIONS
          ================================================= */}

          {estimatesQuery.isPending ? (
            <Loader className="py-8" label="Fetching fares" />
          ) : estimatesQuery.isError ? (
            <ErrorState onRetry={() => void estimatesQuery.refetch()} />
          ) : (
            <div
              className="
                no-scrollbar
                max-h-[38vh]
                space-y-2
                overflow-y-auto
              "
            >
              {estimatesQuery.data?.map((option) => {
                const isSelected = option.id === selectedCategory;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedCategory(option.id)}
                    className={cn(
                      `
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        p-3
                        text-left
                        transition-all
                        duration-200
                        active:scale-[0.99]
                        `,
                      isSelected
                        ? `
                            border-primary
                            bg-primary/10
                            shadow-sm
                          `
                        : `
                            border-border
                            bg-elevated
                          `,
                    )}
                  >
                    {/* Vehicle icon */}

                    <span
                      className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          bg-muted
                          text-lg
                        "
                    >
                      {option.id === "bike" ? "🏍" : option.id === "auto" ? "🛺" : "🚗"}
                    </span>

                    {/* Details */}

                    <span className="min-w-0 flex-1">
                      <span
                        className="
                            flex
                            items-center
                            gap-2
                            text-[15px]
                            font-semibold
                            text-foreground
                          "
                      >
                        {option.name}

                        <span
                          className="
                              flex
                              items-center
                              gap-0.5
                              text-[11px]
                              font-medium
                              text-muted-foreground
                            "
                        >
                          <Users className="h-3 w-3" />

                          {option.seats}
                        </span>
                      </span>

                      <span
                        className="
                            block
                            truncate
                            text-[13px]
                            text-muted-foreground
                          "
                      >
                        {option.etaMinutes} min away · {option.tagline}
                      </span>
                    </span>

                    {/* Price */}

                    <span className="shrink-0 text-right">
                      <span
                        className="
                            tabular
                            font-display
                            block
                            text-[15px]
                            font-bold
                            text-foreground
                          "
                      >
                        {formatCurrency(option.fare)}
                      </span>

                      {option.originalFare ? (
                        <span
                          className="
                              tabular
                              block
                              text-[11px]
                              text-muted-foreground
                              line-through
                            "
                        >
                          {formatCurrency(option.originalFare)}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* =================================================
              PAYMENT + PROMO
          ================================================== */}

          <div className="mt-4 flex items-center gap-2">
            {/* Payment */}

            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethodId)}
            >
              <SelectTrigger
                className="
                  h-13
                  flex-1
                  rounded-2xl
                  border-border
                  bg-elevated
                  px-4
                  text-[14px]
                  font-semibold
                "
              >
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

            {/* Promo */}

            <div
              className="
                flex
                h-13
                flex-1
                items-center
                gap-2
                rounded-2xl
                border
                border-border
                bg-elevated
                px-3
              "
            >
              <Ticket
                className="
                  h-4
                  w-4
                  shrink-0
                  text-primary
                "
              />

              <input
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                placeholder="Promo code"
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  text-[14px]
                  font-semibold
                  text-foreground
                  outline-none
                  placeholder:text-muted-foreground/70
                "
              />

              <button
                type="button"
                disabled={!promoInput.trim() || applyPromo.isPending}
                onClick={() => applyPromo.mutate()}
                className="
                  shrink-0
                  text-xs
                  font-bold
                  text-primary
                  disabled:text-muted-foreground
                "
              >
                {applyPromo.isPending ? "..." : "Apply"}
              </button>
            </div>
          </div>

          {/* =================================================
              BOOK RIDE
          ================================================== */}

          <button
            type="button"
            disabled={!selected || book.isPending}
            onClick={() => book.mutate()}
            className="
              glow-primary
              mt-4
              h-14
              w-full
              rounded-2xl
              bg-primary
              text-[15px]
              font-semibold
              text-primary-foreground
              transition-all
              active:scale-[0.99]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {book.isPending
              ? "Requesting…"
              : selected
                ? `Book ${selected.name} · ${formatCurrency(selected.fare)}`
                : "Select a ride"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
