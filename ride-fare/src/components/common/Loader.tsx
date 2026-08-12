import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function Loader({ className, label }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  );
}

export function FullScreenLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader label={label} />
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}

export function RideCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
      <SkeletonBlock className="h-12 w-16" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3.5 w-24" />
        <SkeletonBlock className="h-3 w-36" />
      </div>
      <SkeletonBlock className="h-5 w-14" />
    </div>
  );
}
