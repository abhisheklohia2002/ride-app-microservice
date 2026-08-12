import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, Circle, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { locationApi } from "@/api/location.api";
import { queryKeys } from "@/api/query-keys";
import { AppHeader } from "@/components/common/AppHeader";
import { Loader } from "@/components/common/Loader";
import { PlaceRow } from "@/components/common/PlaceRow";
import { EmptyState } from "@/components/common/States";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRideStore } from "@/store/ride.store";
import type { Place } from "@/types";

type Field = "pickup" | "destination";

export function SearchScreen() {
  const navigate = useNavigate();
  const { pickup, destination, setPickup, setDestination, swapEndpoints } = useRideStore();
  const [field, setField] = useState<Field>("destination");
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);

  const currentQuery = useQuery({
    queryKey: queryKeys.locations.current,
    queryFn: locationApi.currentLocation,
  });
  const savedQuery = useQuery({
    queryKey: queryKeys.locations.saved,
    queryFn: locationApi.savedPlaces,
  });
  const recentQuery = useQuery({
    queryKey: queryKeys.locations.recent,
    queryFn: locationApi.recentPlaces,
  });
  const results = useQuery({
    queryKey: queryKeys.locations.autocomplete(debounced),
    queryFn: () => locationApi.autocomplete(debounced),
    enabled: debounced.trim().length > 1,
  });

  useEffect(() => {
    if (!pickup && currentQuery.data) setPickup(currentQuery.data);
  }, [pickup, currentQuery.data, setPickup]);

  function choose(place: Place) {
    if (field === "pickup") {
      setPickup(place);
      setField("destination");
    } else {
      setDestination(place);
    }
    setQuery("");
    const nextPickup = field === "pickup" ? place : pickup;
    const nextDestination = field === "destination" ? place : destination;
    if (nextPickup && nextDestination) void navigate({ to: "/confirm-ride" });
  }

  const suggestions = debounced.trim().length > 1 ? (results.data ?? []) : [];

  return (
    <div className="min-h-screen bg-background pb-10">
      <AppHeader title="Plan your ride" subtitle="Pick your route" />

      <div className="px-5 pt-4">
        <div className="rounded-3xl border border-border bg-elevated p-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <FieldRow
                icon={<Circle className="h-3.5 w-3.5 text-primary" />}
                label="Pickup"
                value={pickup?.name ?? ""}
                placeholder="Choose pickup"
                active={field === "pickup"}
                query={field === "pickup" ? query : ""}
                onFocus={() => setField("pickup")}
                onChange={setQuery}
              />
              <div className="h-px bg-border" />
              <FieldRow
                icon={<MapPin className="h-3.5 w-3.5 text-foreground" />}
                label="Drop"
                value={destination?.name ?? ""}
                placeholder="Where to?"
                active={field === "destination"}
                query={field === "destination" ? query : ""}
                onFocus={() => setField("destination")}
                onChange={setQuery}
              />
            </div>
            <button
              type="button"
              aria-label="Swap pickup and drop"
              onClick={swapEndpoints}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground active:scale-95"
            >
              <ArrowUpDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5">
          {results.isFetching ? (
            <Loader className="py-6" />
          ) : suggestions.length > 0 ? (
            <>
              <h2 className="mb-1 text-sm font-semibold text-foreground">Search results</h2>
              {suggestions.map((place) => (
                <PlaceRow key={place.id} place={place} onSelect={choose} />
              ))}
            </>
          ) : debounced.trim().length > 1 ? (
            <EmptyState title="No places found" description="Try a different landmark or area." />
          ) : (
            <>
              <h2 className="mb-1 text-sm font-semibold text-foreground">Saved places</h2>
              {savedQuery.data?.map((place) => (
                <PlaceRow key={place.id} place={place} onSelect={choose} />
              ))}
              <h2 className="mt-5 mb-1 text-sm font-semibold text-foreground">Recent</h2>
              {recentQuery.data?.map((place) => (
                <PlaceRow key={place.id} place={place} onSelect={choose} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  icon,
  label,
  value,
  placeholder,
  active,
  query,
  onFocus,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  active: boolean;
  query: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-12 items-center gap-3 px-1">
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <input
          value={active ? query : value}
          onFocus={onFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={value || placeholder}
          className="w-full bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
        />
      </div>
    </div>
  );
}
