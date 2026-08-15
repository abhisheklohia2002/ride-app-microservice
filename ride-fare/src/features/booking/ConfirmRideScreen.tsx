import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useNavigate } from "@tanstack/react-router";

import { Ticket, Users } from "lucide-react";

import { useEffect, useState } from "react";

import { toast } from "sonner";

import { motion } from "framer-motion";

import { locationApi } from "@/api/location.api";
import { paymentApi } from "@/api/payment.api";
import { rideApi } from "@/api/ride.api";
import { getRoute } from "@/api/route.api";

import { queryKeys } from "@/api/query-keys";

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

  /*
   * --------------------------------------------------
   * RIDE STORE
   * --------------------------------------------------
   */

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

  /*
   * --------------------------------------------------
   * LOCAL STATE
   * --------------------------------------------------
   */

  const [promoInput, setPromoInput] = useState(promoCode ?? "");

  const [isBottomSheet, setIsBottomSheet] = useState(true);

  /*
   * --------------------------------------------------
   * VALIDATE PICKUP / DESTINATION
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!pickup || !destination) {
      void navigate({
        to: "/search",
      });
    }
  }, [pickup, destination, navigate]);

  /*
   * --------------------------------------------------
   * OSRM ROUTE
   * --------------------------------------------------
   *
   * pickup
   *    +
   * destination
   *    ↓
   * OSRM
   *    ↓
   * distance
   * duration
   * geometry
   */

  const routeQuery = useQuery({
    queryKey: ["route", pickup?.id, destination?.id],

    queryFn: () => getRoute(pickup!.coords, destination!.coords),

    enabled: Boolean(pickup && destination),

    staleTime: 5 * 60 * 1000,
  });

  /*
   * --------------------------------------------------
   * RIDE ESTIMATES
   * --------------------------------------------------
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
   * --------------------------------------------------
   * DEFAULT CATEGORY
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!selectedCategory && estimatesQuery.data?.[2]) {
      setSelectedCategory(estimatesQuery.data[2].id);
    }
  }, [estimatesQuery.data, selectedCategory, setSelectedCategory]);

  /*
   * --------------------------------------------------
   * PROMO
   * --------------------------------------------------
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
   * --------------------------------------------------
   * BOOK RIDE
   * --------------------------------------------------
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
   * --------------------------------------------------
   * SELECTED RIDE
   * --------------------------------------------------
   */

  const selected = estimatesQuery.data?.find((option) => option.id === selectedCategory);

  /*
   * --------------------------------------------------
   * BOTTOM SHEET
   * --------------------------------------------------
   */

  const toggleSheet = () => {
    setIsBottomSheet((previous) => !previous);
  };

  /*
   * --------------------------------------------------
   * RENDER
   * --------------------------------------------------
   */

  return (
    <div
      className="
        relative
        flex
        min-h-screen
        flex-col
        bg-background
      "
    >
      {/* =================================================
          MAP
      ================================================= */}

      <MapCanvas
        className="
    absolute
    inset-0
    h-full
    w-full
  "
        pickup={pickup?.coords}
        destination={destination?.coords}
        polyline={routeQuery.data?.geometry ?? []}
      />

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className="
          relative
          z-30
        "
      >
        <AppHeader
          title={destination?.name ?? "Choose a ride"}

          subtitle={
            routeQuery.isPending
              ? "Calculating route…"
              : routeQuery.isError
                ? "Route unavailable"
                : routeQuery.data
                  ? `${formatDistance(routeQuery.data.distanceKm)} · ${formatDuration(
                      routeQuery.data.durationMinutes,
                    )}`
                  : "Calculating route…"
          }
        />
      </div>

      {/* =================================================
          BOTTOM SHEET
      ================================================= */}

      <div
        className="
          relative
          z-20
          mt-auto
        "
      >
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
          <BottomSheet
            className="
              space-y-4
              overflow-hidden
              pb-8
            "
          >
            {/* =========================================
                DRAG / COLLAPSE AREA
            ========================================== */}

            <button
              type="button"
              onClick={toggleSheet}
              className="
                mx-auto
                flex
                h-2
                w-12
                rounded-full
                bg-muted
              "
              aria-label={isBottomSheet ? "Collapse ride details" : "Expand ride details"}
            />

            {/* =========================================
                ROUTE INFORMATION
            ========================================== */}

            <div
              className="
                rounded-2xl
                border
                border-border
                bg-elevated
                p-4
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <div
                  className="
                    mt-1
                    flex
                    flex-col
                    items-center
                  "
                >
                  <span
                    className="
                      h-3
                      w-3
                      rounded-full
                      border-2
                      border-primary
                      bg-background
                    "
                  />

                  <span
                    className="
                      my-1
                      h-7
                      border-l
                      border-dashed
                      border-muted-foreground/40
                    "
                  />

                  <span
                    className="
                      h-3
                      w-3
                      rotate-45
                      rounded-sm
                      bg-foreground
                    "
                  />
                </div>

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-muted-foreground
                    "
                  >
                    Pickup
                  </p>

                  <p
                    className="
                      truncate
                      text-[14px]
                      font-semibold
                      text-foreground
                    "
                  >
                    {pickup?.name ?? "Current location"}
                  </p>

                  <p
                    className="
                      truncate
                      text-[12px]
                      text-muted-foreground
                    "
                  >
                    {pickup?.address}
                  </p>

                  <div
                    className="
                      my-3
                      h-px
                      bg-border
                    "
                  />

                  <p
                    className="
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-muted-foreground
                    "
                  >
                    Destination
                  </p>

                  <p
                    className="
                      truncate
                      text-[14px]
                      font-semibold
                      text-foreground
                    "
                  >
                    {destination?.name}
                  </p>

                  <p
                    className="
                      truncate
                      text-[12px]
                      text-muted-foreground
                    "
                  >
                    {destination?.address}
                  </p>
                </div>
              </div>

              {/* Route status */}

              <div
                className="
                  mt-4
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-muted/50
                  px-3
                  py-2
                "
              >
                {routeQuery.isPending ? (
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-[12px]
                      text-muted-foreground
                    "
                  >
                    <span
                      className="
                        h-3.5
                        w-3.5
                        animate-spin
                        rounded-full
                        border-2
                        border-muted-foreground/30
                        border-t-primary
                      "
                    />
                    Calculating route...
                  </div>
                ) : routeQuery.isError ? (
                  <span
                    className="
                      text-[12px]
                      text-destructive
                    "
                  >
                    Unable to calculate route
                  </span>
                ) : routeQuery.data ? (
                  <>
                    <span
                      className="
                        text-[13px]
                        font-semibold
                        text-foreground
                      "
                    >
                      {formatDistance(routeQuery.data.distanceKm)}
                    </span>

                    <span
                      className="
                        text-[12px]
                        text-muted-foreground
                      "
                    >
                      •
                    </span>

                    <span
                      className="
                        text-[13px]
                        font-semibold
                        text-foreground
                      "
                    >
                      {formatDuration(routeQuery.data.durationMinutes)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            {/* =========================================
                CHOOSE RIDE
            ========================================== */}

            <h2
              className="
                text-sm
                font-semibold
                text-foreground
              "
            >
              Choose a ride
            </h2>

            {estimatesQuery.isPending ? (
              <Loader className="py-8" label="Fetching fares" />
            ) : estimatesQuery.isError ? (
              <ErrorState onRetry={() => void estimatesQuery.refetch()} />
            ) : (
              <div
                className="
                  no-scrollbar
                  max-h-[30vh]
                  space-y-2
                  overflow-y-auto
                "
              >
                {estimatesQuery.data?.map((option) => (
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
                          transition-colors
                        `,

                      option.id === selectedCategory
                        ? `
                            border-primary
                            bg-primary/10
                          `
                        : `
                            border-border
                            bg-elevated
                          `,
                    )}
                  >
                    {/* Vehicle */}

                    <span
                      className="
                          flex
                          h-11
                          w-11
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

                    <span
                      className="
                          min-w-0
                          flex-1
                        "
                    >
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
                          <Users
                            className="
                                h-3
                                w-3
                              "
                          />

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

                    {/* Fare */}

                    <span
                      className="
                          text-right
                        "
                    >
                      <span
                        className="
                            tabular
                            block
                            font-display
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
                ))}
              </div>
            )}

            {/* =========================================
                PAYMENT + PROMO
            ========================================== */}

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
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

            {/* =========================================
                BOOK BUTTON
            ========================================== */}

            <button
              type="button"
              disabled={!selected || book.isPending || routeQuery.isPending || routeQuery.isError}
              onClick={() => book.mutate()}
              className="
                glow-primary
                h-14
                w-full
                rounded-2xl
                bg-primary
                text-[15px]
                font-semibold
                text-primary-foreground
                transition-transform
                active:scale-[0.99]
                disabled:opacity-60
              "
            >
              {book.isPending
                ? "Requesting…"
                : routeQuery.isPending
                  ? "Calculating route…"
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
