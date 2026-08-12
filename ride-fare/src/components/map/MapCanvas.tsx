import { useId, useMemo } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { LatLng } from "@/types";

export interface MapVehicle {
  id: string;
  coords: LatLng;
  kind?: "car" | "bike" | "auto";
}

interface MapCanvasProps {
  polyline?: LatLng[];
  pickup?: LatLng | undefined;
  destination?: LatLng | undefined;
  vehicles?: MapVehicle[];
  /** 0..1 position of the tracked vehicle along the polyline. */
  focus?: LatLng | undefined;
  className?: string;
  animateRoute?: boolean;
  showRadar?: boolean;
}

interface Projector {
  x: (lng: number) => number;
  y: (lat: number) => number;
}

function makeProjector(points: LatLng[]): Projector {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(0.006, maxLat - minLat);
  const spanLng = Math.max(0.006, maxLng - minLng);
  const padLat = spanLat * 0.28;
  const padLng = spanLng * 0.22;

  return {
    x: (lng) => ((lng - (minLng - padLng)) / (spanLng + padLng * 2)) * 100,
    y: (lat) => 100 - ((lat - (minLat - padLat)) / (spanLat + padLat * 2)) * 100,
  };
}

const DECOR_BLOCKS = [
  { x: 4, y: 8, w: 22, h: 16 },
  { x: 32, y: 3, w: 18, h: 12 },
  { x: 62, y: 10, w: 26, h: 18 },
  { x: 8, y: 34, w: 16, h: 22 },
  { x: 46, y: 30, w: 20, h: 14 },
  { x: 72, y: 40, w: 22, h: 20 },
  { x: 12, y: 66, w: 24, h: 18 },
  { x: 44, y: 62, w: 18, h: 24 },
  { x: 68, y: 74, w: 26, h: 14 },
];

const DECOR_ROADS_H = [18, 38, 58, 78, 92];
const DECOR_ROADS_V = [14, 34, 54, 74, 90];

export function MapCanvas({
  polyline = [],
  pickup,
  destination,
  vehicles = [],
  focus,
  className,
  animateRoute = true,
  showRadar = false,
}: MapCanvasProps) {
  const gradientId = useId().replace(/:/g, "");
  const reference = useMemo(() => {
    const all = [...polyline, ...vehicles.map((v) => v.coords)];
    if (pickup) all.push(pickup);
    if (destination) all.push(destination);
    if (focus) all.push(focus);
    return all.length > 1 ? all : [{ lat: 12.9719, lng: 77.6412 }, { lat: 12.9351, lng: 77.6916 }];
  }, [polyline, vehicles, pickup, destination, focus]);

  const project = useMemo(() => makeProjector(reference), [reference]);
  const path = useMemo(
    () =>
      polyline
        .map((point, i) => `${i === 0 ? "M" : "L"}${project.x(point.lng).toFixed(2)} ${project.y(point.lat).toFixed(2)}`)
        .join(" "),
    [polyline, project],
  );

  return (
    <div className={cn("relative overflow-hidden bg-map-land", className)} aria-hidden="true">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={`route-${gradientId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.65" />
            <stop offset="100%" stopColor="var(--color-primary)" />
          </linearGradient>
          <radialGradient id={`vignette-${gradientId}`} cx="50%" cy="45%" r="70%">
            <stop offset="55%" stopColor="transparent" />
            <stop offset="100%" stopColor="oklch(0 0 0 / 45%)" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="100" height="100" fill="var(--color-map-land)" />

        {/* stylised water body */}
        <path
          d="M-6 74 C 12 66, 26 88, 44 82 C 62 76, 74 96, 106 88 L106 106 L-6 106 Z"
          fill="var(--color-map-water)"
          opacity="0.5"
        />

        {DECOR_BLOCKS.map((block) => (
          <rect
            key={`${block.x}-${block.y}`}
            x={block.x}
            y={block.y}
            width={block.w}
            height={block.h}
            rx="2"
            fill="var(--color-map-block)"
          />
        ))}

        {DECOR_ROADS_H.map((y) => (
          <line
            key={`h-${y}`}
            x1="-5"
            x2="105"
            y1={y}
            y2={y}
            stroke="var(--color-map-road)"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
        ))}
        {DECOR_ROADS_V.map((x) => (
          <line
            key={`v-${x}`}
            y1="-5"
            y2="105"
            x1={x}
            x2={x}
            stroke="var(--color-map-road)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.7"
          />
        ))}

        {path && (
          <>
            <path
              d={path}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="4.4"
              strokeLinecap="round"
              opacity="0.16"
            />
            <motion.path
              d={path}
              fill="none"
              stroke={`url(#route-${gradientId})`}
              strokeWidth="1.9"
              strokeLinecap="round"
              initial={animateRoute ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
            />
          </>
        )}

        <rect x="0" y="0" width="100" height="100" fill={`url(#vignette-${gradientId})`} />
      </svg>

      {/* Markers rendered as DOM so they stay crisp and animatable */}
      {vehicles.map((vehicle) => (
        <motion.div
          key={vehicle.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          initial={false}
          animate={{
            left: `${project.x(vehicle.coords.lng)}%`,
            top: `${project.y(vehicle.coords.lat)}%`,
          }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-foreground/90 text-[10px] shadow-lg">
            <span className="text-background">
              {vehicle.kind === "bike" ? "🏍" : vehicle.kind === "auto" ? "🛺" : "🚗"}
            </span>
          </div>
        </motion.div>
      ))}

      {pickup && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${project.x(pickup.lng)}%`, top: `${project.y(pickup.lat)}%` }}
        >
          {showRadar && (
            <span className="pulse-ring absolute inset-0 -m-4 rounded-full border border-primary/60" />
          )}
          <span className="block h-3.5 w-3.5 rounded-full border-[3px] border-primary bg-background shadow-md" />
        </div>
      )}

      {destination && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full"
          style={{ left: `${project.x(destination.lng)}%`, top: `${project.y(destination.lat)}%` }}
        >
          <span className="block h-4 w-4 rotate-45 rounded-tl-full rounded-tr-full rounded-br-full bg-foreground shadow-md" />
        </div>
      )}
    </div>
  );
}
