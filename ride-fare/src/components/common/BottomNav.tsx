import { Link } from "@tanstack/react-router";
import { Clock, Home, User } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "Trips", icon: Clock },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="pb-safe sticky bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/90 px-2 pt-2 backdrop-blur-xl">
      {ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold text-muted-foreground"
          activeProps={{ className: "text-primary" }}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
