import { useInfiniteQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";

import { queryKeys } from "@/api/query-keys";
import { rideApi } from "@/api/ride.api";
import { StatusBadge } from "@/components/common/Chip";
import { BottomNav } from "@/components/common/BottomNav";
import { RideCardSkeleton } from "@/components/common/Loader";
import { EmptyState, ErrorState } from "@/components/common/States";
import { formatCurrency, formatDateTime, formatDistance } from "@/utils/format";

export function HistoryScreen() {
  const query = useInfiniteQuery({
    queryKey: [...queryKeys.rides.history, "infinite"],
    queryFn: ({ pageParam }) => rideApi.history(pageParam as number, 4),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const rides = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 px-5 pb-3 backdrop-blur-xl">
        <h1 className="font-display text-xl font-bold text-foreground">Your trips</h1>
        <p className="text-xs text-muted-foreground">Every ride, receipt and route</p>
      </header>

      <div className="flex-1 space-y-3 px-5 py-5">
        {query.isPending ? (
          [0, 1, 2, 3].map((i) => <RideCardSkeleton key={i} />)
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : rides.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No trips yet"
            description="Book your first ride and it will show up here."
          />
        ) : (
          <>
            {rides.map((ride) => (
              <article key={ride.id} className="rounded-3xl border border-border bg-elevated p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-foreground">
                      {ride.destination.name}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      From {ride.pickup.name} · {formatDateTime(ride.requestedAt)}
                    </p>
                  </div>
                  <StatusBadge tone={ride.status === "cancelled" ? "danger" : "primary"}>
                    {ride.status}
                  </StatusBadge>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <p className="text-[13px] text-muted-foreground">
                    {ride.categoryName} · {formatDistance(ride.route.distanceKm)}
                  </p>
                  <p className="tabular font-display text-[15px] font-bold text-foreground">
                    {formatCurrency(ride.fare)}
                  </p>
                </div>
              </article>
            ))}

            {query.hasNextPage ? (
              <button
                type="button"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
                className="h-13 w-full rounded-2xl border border-border bg-card text-[14px] font-semibold text-foreground active:scale-[0.99]"
              >
                {query.isFetchingNextPage ? "Loading…" : "Load more trips"}
              </button>
            ) : null}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
