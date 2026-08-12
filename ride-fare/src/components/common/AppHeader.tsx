import { ChevronLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AppHeader({
  title,
  subtitle,
  trailing,
  onBack,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();

  return (
    <header className="pt-safe sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 pb-3 backdrop-blur-xl">
      <button
        type="button"
        aria-label="Go back"
        onClick={() => (onBack ? onBack() : router.history.back())}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[17px] font-semibold text-foreground">{title}</h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {trailing}
    </header>
  );
}
