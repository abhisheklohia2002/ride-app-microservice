import { Search, X } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  leading?: ReactNode;
  onClear?: () => void;
}

export function SearchInput({
  value,
  onValueChange,
  leading,
  onClear,
  className,
  ...props
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-3 rounded-2xl border border-border bg-elevated px-4 transition-colors focus-within:border-primary/50",
        className,
      )}
    >
      <span className="text-muted-foreground">{leading ?? <Search className="h-4.5 w-4.5" />}</span>
      <input
        {...props}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
      />
      {value.length > 0 ? (
        <button
          type="button"
          aria-label="Clear"
          onClick={() => {
            onValueChange("");
            onClear?.();
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-90"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
