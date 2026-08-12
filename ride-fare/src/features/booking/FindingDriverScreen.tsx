import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";

import { queryKeys } from "@/api/query-keys";
import { rideApi } from "@/api/ride.api";
import { BottomSheet } from "@/components/common/BottomSheet";
import { MapCanvas } from "@/components/map/MapCanvas";
import { nearbyDrivers } from "@/api/mock/db";
import { useRideStore } from "@/store/ride.store";

export function FindingDriverScreen() {
  const navigate = useNavigate();
  const { activeRideId, pickup, setDriver, setRideStatus, resetBooking } = useRideStore();

  useEffect(() => {
    if (!activeRideId) void navigate({ to: "/" });
  }, [activeRideId, navigate]);

  const rideQuery = useQuery({
    queryKey: queryKeys.rides.detail(activeRideId ?? "none"),
    queryFn: () => rideApi.byId(activeRideId!),
    enabled: Boolean(activeRideId),
  });

  const assign = useMutation({
    mutationFn: () => rideApi.assignDriver(activeRideId!),
    onSuccess: (ride) => {
      if (ride.driver) setDriver(ride.driver);
      setRideStatus("arriving");
      toast.success(`${ride.driver?.name ?? "Your captain"} is on the way`);
      void navigate({ to: "/ride" });
    },
  });

  useEffect(() => {
    if (!activeRideId) return;
    const timer = setTimeout(() => assign.mutate(), 3200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRideId]);

  const cancel = useMutation({
    mutationFn: () => rideApi.cancel(activeRideId!, "changed_plans"),
    onSuccess: () => {
      resetBooking();
      toast.message("Ride request cancelled");
      void navigate({ to: "/" });
    },
  });

  const vehicles = pickup
    ? nearbyDrivers(pickup, 6).map((driver, i) => ({
        id: driver.id,
        coords: driver.coords,
        kind: (i % 3 === 0 ? "auto" : i % 2 === 0 ? "bike" : "car") as "auto" | "bike" | "car",
      }))
    : [];

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <MapCanvas
        className="absolute inset-0"
        polyline={rideQuery.data?.route.polyline ?? []}
        pickup={pickup?.coords}
        vehicles={vehicles}
        showRadar
      />
      <div className="relative z-20 mt-auto">
        <BottomSheet className="space-y-5 pb-8">
          <div className="flex items-center gap-4">
            <span className="pulse-ring flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/60" />
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Finding your captain
              </h1>
              <p className="text-[13px] text-muted-foreground">
                Matching you with the nearest {rideQuery.data?.categoryName ?? "ride"}…
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-elevated p-4 text-[13px] text-muted-foreground">
            <p className="font-semibold text-foreground">{rideQuery.data?.pickup.name}</p>
            <p className="truncate">{rideQuery.data?.pickup.address}</p>
            <div className="my-2 h-px bg-border" />
            <p className="font-semibold text-foreground">{rideQuery.data?.destination.name}</p>
            <p className="truncate">{rideQuery.data?.destination.address}</p>
          </div>

          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate()}
            className="h-13 w-full rounded-2xl border border-border bg-card text-[15px] font-semibold text-foreground active:scale-[0.99]"
          >
            Cancel request
          </button>
        </BottomSheet>
      </div>
    </div>
  );
}
