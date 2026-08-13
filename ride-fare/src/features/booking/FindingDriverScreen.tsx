import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { toast } from "sonner";

import { queryKeys } from "@/api/query-keys";
import { rideApi } from "@/api/ride.api";
import { nearbyDrivers } from "@/api/mock/db";

import { BottomSheet } from "@/components/common/BottomSheet";
import { MapCanvas } from "@/components/map/MapCanvas";

import { useRideStore } from "@/store/ride.store";

export function FindingDriverScreen() {
  const navigate = useNavigate();

  const { activeRideId, pickup, setDriver, setRideStatus, resetBooking } = useRideStore();

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(true);

  /*
   * --------------------------------------------------
   * Redirect if no active ride
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
   * Assign driver
   * --------------------------------------------------
   */

  const assign = useMutation({
    mutationFn: () => rideApi.assignDriver(activeRideId!),

    onSuccess: (ride) => {
      if (ride.driver) {
        setDriver(ride.driver);
      }

      setRideStatus("arriving");

      toast.success(`${ride.driver?.name ?? "Your captain"} is on the way`);

      void navigate({
        to: "/ride",
      });
    },
  });

  /*
   * --------------------------------------------------
   * Simulate driver matching
   * --------------------------------------------------
   */

  useEffect(() => {
    if (!activeRideId) {
      return;
    }

    const timer = setTimeout(() => {
      assign.mutate();
    }, 3200);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRideId]);

  /*
   * --------------------------------------------------
   * Cancel request
   * --------------------------------------------------
   */

  const cancel = useMutation({
    mutationFn: () => rideApi.cancel(activeRideId!, "changed_plans"),

    onSuccess: () => {
      resetBooking();

      toast.message("Ride request cancelled");

      void navigate({
        to: "/",
      });
    },
  });

  /*
   * --------------------------------------------------
   * Nearby drivers
   * --------------------------------------------------
   */

  const vehicles = pickup
    ? nearbyDrivers(pickup, 6).map((driver, index) => ({
        id: driver.id,

        coords: driver.coords,

        kind: (index % 3 === 0 ? "auto" : index % 2 === 0 ? "bike" : "car") as
          "auto" | "bike" | "car",
      }))
    : [];

  /*
   * --------------------------------------------------
   * Bottom sheet controls
   * --------------------------------------------------
   */

  const toggleBottomSheet = () => {
    setIsBottomSheetOpen((previous) => !previous);
  };

  /*
   * --------------------------------------------------
   * Swipe handling
   * --------------------------------------------------
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
    <main
      className="
        relative
        min-h-dvh
        overflow-hidden
        bg-background
      "
    >
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
        polyline={rideQuery.data?.route.polyline ?? []}
        pickup={pickup?.coords}
        vehicles={vehicles}
        showRadar
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
          height: isBottomSheetOpen ? "auto" : "96px",
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
            px-5
            pb-8
            transition-opacity
            duration-200
            ${isBottomSheetOpen ? "opacity-100" : "pointer-events-none opacity-0"}
          `}
        >
          <div className="space-y-5">
            {/* =================================================
                FINDING DRIVER
            ================================================= */}

            <div className="flex items-center gap-4">
              <span
                className="
                  pulse-ring
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-primary/60
                "
              />

              <div className="min-w-0">
                <h1
                  className="
                    font-display
                    text-xl
                    font-bold
                    text-foreground
                  "
                >
                  Finding your captain
                </h1>

                <p
                  className="
                    text-[13px]
                    text-muted-foreground
                  "
                >
                  Matching you with the nearest {rideQuery.data?.categoryName ?? "ride"}…
                </p>
              </div>
            </div>

            {/* =================================================
                PICKUP / DESTINATION
            ================================================== */}

            <div
              className="
                rounded-2xl
                border
                border-border
                bg-elevated
                p-4
                text-[13px]
                text-muted-foreground
              "
            >
              {/* Pickup */}

              <p
                className="
                  font-semibold
                  text-foreground
                "
              >
                {rideQuery.data?.pickup.name}
              </p>

              <p className="truncate">{rideQuery.data?.pickup.address}</p>

              <div
                className="
                  my-2
                  h-px
                  bg-border
                "
              />

              {/* Destination */}

              <p
                className="
                  font-semibold
                  text-foreground
                "
              >
                {rideQuery.data?.destination.name}
              </p>

              <p className="truncate">{rideQuery.data?.destination.address}</p>
            </div>

            {/* =================================================
                CANCEL
            ================================================== */}

            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
              className="
                h-13
                w-full
                rounded-2xl
                border
                border-border
                bg-card
                text-[15px]
                font-semibold
                text-foreground
                transition-all
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {cancel.isPending ? "Cancelling…" : "Cancel request"}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
