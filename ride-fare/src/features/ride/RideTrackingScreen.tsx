import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Phone, MessageSquare, Shield, Star } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { toast } from "sonner";

import { queryKeys } from "@/api/query-keys";
import { rideApi } from "@/api/ride.api";

import { BottomSheet } from "@/components/common/BottomSheet";
import { StatusBadge } from "@/components/common/Chip";
import { FullScreenLoader } from "@/components/common/Loader";
import { UserAvatar } from "@/components/common/UserAvatar";
import { MapCanvas } from "@/components/map/MapCanvas";

import { useRideStore } from "@/store/ride.store";

import type { LatLng, RideStatus } from "@/types";

import { formatCurrency, formatDuration } from "@/utils/format";

/**
 * Interpolates a point along a polyline
 * for the driver marker.
 */
function pointAt(polyline: LatLng[], progress: number): LatLng | undefined {
  if (polyline.length === 0) {
    return undefined;
  }

  const clamped = Math.min(0.999, Math.max(0, progress));

  const index = Math.floor(clamped * (polyline.length - 1));

  const next = polyline[Math.min(polyline.length - 1, index + 1)]!;

  const current = polyline[index]!;

  const local = clamped * (polyline.length - 1) - index;

  return {
    lat: current.lat + (next.lat - current.lat) * local,

    lng: current.lng + (next.lng - current.lng) * local,
  };
}

const LABELS: Record<
  string,
  {
    title: string;
    hint: string;
  }
> = {
  arriving: {
    title: "Captain on the way",
    hint: "Head to your pickup point",
  },

  arrived: {
    title: "Captain has arrived",
    hint: "Share your OTP to start the trip",
  },

  in_progress: {
    title: "On the trip",
    hint: "Enjoy the ride",
  },

  completed: {
    title: "Trip complete",
    hint: "Time to pay",
  },
};

export function RideTrackingScreen() {
  const navigate = useNavigate();

  const { activeRideId, rideStatus, setRideStatus, resetBooking } = useRideStore();

  const [progress, setProgress] = useState(0);

  const phaseRef = useRef<RideStatus>(rideStatus === "idle" ? "arriving" : rideStatus);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);

  /*
   * --------------------------------------------------
   * Redirect when ride does not exist
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!activeRideId) {
      void navigate({
        to: "/",
      });
    }
  }, [activeRideId, navigate]);

  /*
   * --------------------------------------------------
   * Ride query
   * --------------------------------------------------
   */

  const rideQuery = useQuery({
    queryKey: queryKeys.rides.detail(activeRideId ?? "none"),

    queryFn: () => rideApi.byId(activeRideId!),

    enabled: Boolean(activeRideId),
  });

  /*
   * --------------------------------------------------
   * Update ride status
   * --------------------------------------------------
   */

  const updateStatus = useMutation({
    mutationFn: (status: RideStatus) => rideApi.updateStatus(activeRideId!, status),
  });

  /*
   * --------------------------------------------------
   * Cancel ride
   * --------------------------------------------------
   */

  const cancel = useMutation({
    mutationFn: () => rideApi.cancel(activeRideId!, "changed_plans"),

    onSuccess: () => {
      resetBooking();

      toast.message("Ride cancelled");

      void navigate({
        to: "/",
      });
    },
  });

  /*
   * --------------------------------------------------
   * Dummy live tracking
   *
   * Driver → pickup
   * Pickup → destination
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!activeRideId) {
      return;
    }

    if (phaseRef.current === "completed") {
      return;
    }

    const timer = setInterval(() => {
      setProgress((previous) => {
        const next = previous + 0.035;

        if (next >= 1) {
          /*
           * Driver arrived
           */
          if (phaseRef.current === "arriving") {
            phaseRef.current = "arrived";

            setRideStatus("arrived");

            updateStatus.mutate("arrived");

            toast.success("Your captain has arrived");

            return 0;
          }

          /*
           * Trip started
           */
          if (phaseRef.current === "arrived") {
            phaseRef.current = "in_progress";

            setRideStatus("in_progress");

            updateStatus.mutate("in_progress");

            toast.message("Trip started");

            return 0;
          }

          /*
           * Trip completed
           */
          phaseRef.current = "completed";

          setRideStatus("completed");

          updateStatus.mutate("completed");

          void navigate({
            to: "/payment",
          });

          return 1;
        }

        return next;
      });
    }, 700);

    return () => clearInterval(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRideId]);

  /*
   * --------------------------------------------------
   * Loading
   * --------------------------------------------------
   */

  const ride = rideQuery.data;

  if (!ride) {
    return <FullScreenLoader label="Loading your ride" />;
  }

  /*
   * --------------------------------------------------
   * Tracking calculations
   * --------------------------------------------------
   */

  const polyline = ride.route.polyline;

  const status = phaseRef.current;

  const approach = [
    {
      lat: polyline[0]!.lat + 0.012,

      lng: polyline[0]!.lng - 0.01,
    },

    polyline[0]!,
  ];

  const driverCoords =
    status === "arriving"
      ? pointAt(approach, progress)
      : status === "in_progress"
        ? pointAt(polyline, progress)
        : polyline[0];

  const label = LABELS[status] ?? LABELS?.arriving;

  const etaMinutes =
    status === "arriving"
      ? Math.max(1, Math.round((1 - progress) * 5))
      : Math.max(1, Math.round((1 - progress) * ride.route.durationMinutes));

  /*
   * --------------------------------------------------
   * Bottom sheet
   * --------------------------------------------------
   */

  const toggleBottomSheet = () => {
    setIsBottomSheetOpen((previous) => !previous);
  };

  /*
   * Swipe handling
   */
  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,

    info: PanInfo,
  ) => {
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
      {/* =================================================
          FULL SCREEN MAP
      ================================================== */}

      <MapCanvas
        className="
          absolute
          inset-0
          h-full
          w-full
        "
        pickup={ride.pickup.coords}
        destination={ride.destination.coords}
        vehicles={
          driverCoords
            ? [
                {
                  id: "driver",
                  coords: driverCoords,
                  kind: "car",
                },
              ]
            : []
        }
      />

      {/* =================================================
          BOTTOM SHEET
      ================================================== */}

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
          height: isBottomSheetOpen ? "calc(100dvh - 110px)" : "96px",
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
            cursor-grab
            items-center
            justify-center
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
          className={`
            h-[calc(100%-40px)]
            overflow-y-auto
            overscroll-contain
            px-5
            pb-8
            transition-opacity
            duration-200
            ${isBottomSheetOpen ? "opacity-100" : "pointer-events-none opacity-0"}
          `}
        >
          {/* =================================================
              STATUS
          ================================================== */}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1
                className="
                  font-display
                  text-xl
                  font-bold
                  text-foreground
                "
              >
                {label?.title}
              </h1>

              <p
                className="
                  text-[13px]
                  text-muted-foreground
                "
              >
                {label?.hint}
              </p>
            </div>

            <StatusBadge tone="primary">
              {status === "arrived" ? "Waiting" : `${formatDuration(etaMinutes)} left`}
            </StatusBadge>
          </div>

          {/* =================================================
              PROGRESS
          ================================================== */}

          <div
            className="
              mt-4
              h-1.5
              overflow-hidden
              rounded-full
              bg-muted
            "
          >
            <motion.div
              className="
                h-full
                rounded-full
                bg-primary
              "
              animate={{
                width: `${Math.round(progress * 100)}%`,
              }}
              transition={{
                duration: 0.3,
              }}
            />
          </div>

          {/* =================================================
              DRIVER CARD
          ================================================== */}

          {ride.driver ? (
            <div
              className="
                mt-4
                flex
                items-center
                gap-3
                rounded-3xl
                border
                border-border
                bg-elevated
                p-3
              "
            >
              <UserAvatar name={ride.driver.name} />

              <div className="min-w-0 flex-1">
                <p
                  className="
                    truncate
                    text-[15px]
                    font-semibold
                    text-foreground
                  "
                >
                  {ride.driver.name}
                </p>

                <p
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[13px]
                    text-muted-foreground
                  "
                >
                  <Star
                    className="
                      h-3
                      w-3
                      fill-primary
                      text-primary
                    "
                  />

                  {ride.driver.rating}

                  <span>·</span>

                  {ride.driver.vehicleModel}
                </p>
              </div>

              <div className="text-right">
                <p
                  className="
                    tabular
                    font-display
                    text-[13px]
                    font-bold
                    text-foreground
                  "
                >
                  {ride.driver.vehicleNumber}
                </p>

                <p
                  className="
                    text-[11px]
                    text-muted-foreground
                  "
                >
                  {ride.driver.vehicleColor}
                </p>
              </div>
            </div>
          ) : null}

          {/* =================================================
              OTP + CALL + MESSAGE
          ================================================== */}

          <div className="mt-4 flex items-center gap-2">
            <div
              className="
                flex
                h-13
                flex-1
                items-center
                justify-between
                rounded-2xl
                border
                border-border
                bg-elevated
                px-4
              "
            >
              <span
                className="
                  text-[11px]
                  font-semibold
                  tracking-wide
                  text-muted-foreground
                  uppercase
                "
              >
                Start OTP
              </span>

              <span
                className="
                  tabular
                  font-display
                  text-lg
                  font-bold
                  tracking-[0.25em]
                  text-primary
                "
              >
                {ride.otp}
              </span>
            </div>

            {/* Call */}

            <button
              type="button"
              aria-label="Call captain"
              onClick={() => toast.success("Calling your captain…")}
              className="
                flex
                h-13
                w-13
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-border
                bg-elevated
                text-foreground
                transition-transform
                active:scale-95
              "
            >
              <Phone className="h-4.5 w-4.5" />
            </button>

            {/* Message */}

            <button
              type="button"
              aria-label="Message captain"
              onClick={() => toast.message("Chat opens once the captain accepts messages")}
              className="
                flex
                h-13
                w-13
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-border
                bg-elevated
                text-foreground
                transition-transform
                active:scale-95
              "
            >
              <MessageSquare className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* =================================================
              DESTINATION + FARE
          ================================================== */}

          <div
            className="
              mt-4
              flex
              items-center
              justify-between
              rounded-2xl
              border
              border-border
              bg-elevated
              px-4
              py-3
            "
          >
            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-[13px]
                  text-muted-foreground
                "
              >
                Dropping at
              </p>

              <p
                className="
                  truncate
                  text-[15px]
                  font-semibold
                  text-foreground
                "
              >
                {ride.destination.name}
              </p>
            </div>

            <p
              className="
                tabular
                font-display
                text-[15px]
                font-bold
                text-foreground
              "
            >
              {formatCurrency(ride.fare)}
            </p>
          </div>

          {/* =================================================
              SAFETY + CANCEL / PAY
          ================================================== */}

          <div className="mt-4 flex gap-2">
            {/* Safety */}

            <button
              type="button"
              onClick={() => toast.success("Emergency contact notified with your live location")}
              className="
                flex
                h-13
                flex-1
                items-center
                justify-center
                gap-2
                rounded-2xl
                border
                border-border
                bg-card
                text-[14px]
                font-semibold
                text-foreground
                transition-transform
                active:scale-[0.99]
              "
            >
              <Shield className="h-4 w-4" />
              Safety
            </button>

            {status !== "in_progress" ? (
              <button
                type="button"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate()}
                className="
                  h-13
                  flex-1
                  rounded-2xl
                  border
                  border-border
                  bg-card
                  text-[14px]
                  font-semibold
                  text-destructive
                  transition-transform
                  active:scale-[0.99]
                  disabled:opacity-60
                "
              >
                {cancel.isPending ? "Cancelling…" : "Cancel ride"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void navigate({
                    to: "/payment",
                  })
                }
                className="
                  h-13
                  flex-1
                  rounded-2xl
                  bg-primary
                  text-[14px]
                  font-semibold
                  text-primary-foreground
                  transition-transform
                  active:scale-[0.99]
                "
              >
                End & pay
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </main>
  );
}
