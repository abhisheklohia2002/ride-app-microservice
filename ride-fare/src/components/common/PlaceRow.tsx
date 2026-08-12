import { Briefcase, Clock, House, MapPin, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Place } from "@/types";

const ICONS = {
  home: House,
  work: Briefcase,
  favorite: Star,
  recent: Clock,
  poi: MapPin,
} as const;

export function PlaceRow({
  place,
  onSelect,
  trailing,
  className,
}: {
  place: Place;
  onSelect?: (place: Place) => void;
  trailing?: React.ReactNode;
  className?: string;
}) {
  const Icon = ICONS[place.category] ?? MapPin;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(place)}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl px-2 py-3 text-left transition-colors active:bg-accent",
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-4.5 w-4.5 text-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-foreground">
          {place.name}
        </span>
        <span className="block truncate text-[13px] text-muted-foreground">{place.address}</span>
      </span>
      {trailing}
    </button>
  );
}
