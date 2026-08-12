import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronRight, Search, Ticket, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { locationApi } from "@/api/location.api";
import { paymentApi } from "@/api/payment.api";
import { rideApi } from "@/api/ride.api";
import { queryKeys } from "@/api/query-keys";
import { BottomSheet } from "@/components/common/BottomSheet";
import { Chip, StatusBadge } from "@/components/common/Chip";
import { Loader, RideCardSkeleton } from "@/components/common/Loader";
import { PlaceRow } from "@/components/common/PlaceRow";
import { ErrorState } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { BottomNav } from "@/components/common/BottomNav";
import { MapCanvas } from "@/components/map/MapCanvas";
import { useRideStore } from "@/store/ride.store";
import type { Place } from "@/types";
import { nearbyDrivers } from "@/api/mock/db";
import { formatCurrency, formatRelativeDay } from "@/utils/format";

export function HomeScreen() {
  const navigate = useNavigate();
  const [isBottomSheet, setIsBottomSheet] = useState(true);
  const { setPickup, setDestination } = useRideStore();
  const startRide = (place: Place) => {
    setDestination(place);
    void navigate({ to: "/confirm-ride" });
  };

  const savedQuery = useQuery({
    queryKey: queryKeys.locations.saved,
    queryFn: locationApi.savedPlaces,
  });
  const recentQuery = useQuery({
    queryKey: queryKeys.locations.recent,
    queryFn: locationApi.recentPlaces,
  });
  const promoQuery = useQuery({
    queryKey: queryKeys.payments.promotions,
    queryFn: paymentApi.promotions,
  });
  const historyQuery = useQuery({
    queryKey: [...queryKeys.rides.history, 1],
    queryFn: () => rideApi.history(1, 3),
  });

  const currentPlace = savedQuery.data?.[0];
  useEffect(() => {
    if (currentPlace) setPickup(currentPlace);
  }, [currentPlace, setPickup]);

  const vehicles = currentPlace
    ? nearbyDrivers(currentPlace, 5).map((driver, i) => ({
        id: driver.id,
        coords: driver.coords,
        kind: (i % 3 === 0 ? "auto" : i % 2 === 0 ? "bike" : "car") as "auto" | "bike" | "car",
      }))
    : [];
  const toggleSheet = () => {
    setIsBottomSheet((prev) => !prev);
  };
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <MapCanvas
        className="absolute inset-x-0 top-0 h-[46vh] min-h-[300px]"
        pickup={currentPlace?.coords}
        vehicles={vehicles}
        showRadar
        animateRoute={false}
      />

      <header className="pt-safe relative z-20 flex items-center justify-between px-5 pb-4">
        <div className="glass flex items-center gap-3 rounded-full border border-border py-1.5 pr-4 pl-1.5">
          <UserAvatar name="Aarav Mehta" size="sm" />
          <div className="leading-tight">
            <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Good day</p>
            <p className="text-sm font-semibold text-foreground">Aarav</p>
          </div>
        </div>
        <button
          type="button"
          className="glass relative flex h-11 w-11 items-center justify-center rounded-full border border-border text-foreground active:scale-95"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </header>

      <div onClick={toggleSheet} className="relative z-10 mt-auto">
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
            className={`pb-10 transition-all duration-300 overflow-hidden ${
              isBottomSheet ? "max-h-[85vh] space-y-6" : "max-h-20"
            }`}
          >
            <div>
              <h1 className="font-display text-[26px] leading-tight font-bold text-foreground">
                Where to today?
              </h1>
              <Link
                to="/search"
                className="mt-4 flex h-15 w-full items-center gap-3 rounded-2xl border border-border bg-elevated px-4 text-left active:scale-[0.99]"
              >
                <Search className="h-4.5 w-4.5 text-primary" />
                <span className="flex-1 text-[15px] font-medium text-muted-foreground">
                  Search destination
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>

              <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
                <Chip active>
                  <Wallet className="h-3.5 w-3.5" /> UPI
                </Chip>
                <Chip>Ride now</Chip>
                <Chip>Schedule</Chip>
                <Chip>Rentals</Chip>
                <Chip>Intercity</Chip>
              </div>
            </div>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-foreground">Saved places</h2>
              {savedQuery.isPending ? (
                <Loader className="py-6" />
              ) : savedQuery.isError ? (
                <ErrorState onRetry={() => void savedQuery.refetch()} />
              ) : (
                <div className="-mx-2">
                  {savedQuery.data?.map((place) => (
                    <PlaceRow key={place.id} place={place} onSelect={startRide} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-1 text-sm font-semibold text-foreground">Recent destinations</h2>
              <div className="-mx-2">
                {recentQuery.data?.map((place) => (
                  <PlaceRow key={place.id} place={place} onSelect={startRide} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Offers for you</h2>
                <StatusBadge tone="primary">{promoQuery.data?.length ?? 0} live</StatusBadge>
              </div>
              <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
                {promoQuery.data?.map((promo) => (
                  <motion.article
                    key={promo.id}
                    whileTap={{ scale: 0.97 }}
                    className="w-64 shrink-0 rounded-3xl border border-border bg-elevated p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                      <Ticket className="h-4 w-4 text-primary" />
                    </span>
                    <h3 className="mt-3 text-[15px] leading-snug font-semibold text-foreground">
                      {promo.title}
                    </h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">{promo.description}</p>
                    <p className="tabular mt-3 font-display text-xs font-semibold tracking-widest text-primary uppercase">
                      {promo.code}
                    </p>
                  </motion.article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">Recent rides</h2>
              <div className="space-y-3">
                {historyQuery.isPending
                  ? [0, 1, 2].map((i) => <RideCardSkeleton key={i} />)
                  : historyQuery.data?.items.map((ride) => (
                      <article
                        key={ride.id}
                        className="flex items-center gap-4 rounded-3xl border border-border bg-elevated p-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold text-foreground">
                            {ride.destination.name}
                          </p>
                          <p className="truncate text-[13px] text-muted-foreground">
                            {formatRelativeDay(ride.requestedAt)} · {ride.categoryName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tabular font-display text-[15px] font-bold text-foreground">
                            {formatCurrency(ride.fare)}
                          </p>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            {ride.status}
                          </p>
                        </div>
                      </article>
                    ))}
              </div>
            </section>
          </BottomSheet>
        </motion.div>
        <BottomNav />
      </div>
    </div>
  );
}
