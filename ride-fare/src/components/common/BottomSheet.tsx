import type { ReactNode } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Sticky bottom sheet used across the booking flow. Not a modal — it is part of
 * the map screens, so it stays inside the layout and respects safe areas.
 */
export function BottomSheet({
  children,
  className,
  grabber = true,
}: {
  children: ReactNode;
  className?: string;
  grabber?: boolean;
}) {
  return (
    <motion.section
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={cn(
        "surface-shadow relative z-30 w-full rounded-t-[2rem] border-t border-border bg-card px-5 pt-3 pb-safe",
        className,
      )}
    >
      {grabber ? (
        <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-muted-foreground/30" />
      ) : null}
      {children}
    </motion.section>
  );
}
