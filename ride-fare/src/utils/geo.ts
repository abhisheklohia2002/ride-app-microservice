import type { LatLng } from "@/types";

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Deterministic pseudo-random in [0,1) derived from a string seed. */
export function seededRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/**
 * Builds a plausible, slightly curved route between two points so the map
 * renders an organic polyline instead of a straight line.
 */
export function buildPolyline(from: LatLng, to: LatLng, steps = 32): LatLng[] {
  const bend = 0.16 + seededRandom(`${from.lat}${to.lng}`) * 0.18;
  const midLat = (from.lat + to.lat) / 2;
  const midLng = (from.lng + to.lng) / 2;
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const control: LatLng = { lat: midLat - dx * bend, lng: midLng + dy * bend };

  const points: LatLng[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const inv = 1 - t;
    points.push({
      lat: inv * inv * from.lat + 2 * inv * t * control.lat + t * t * to.lat,
      lng: inv * inv * from.lng + 2 * inv * t * control.lng + t * t * to.lng,
    });
  }
  return points;
}

export function pointAlongPolyline(points: LatLng[], progress: number): LatLng {
  const first = points[0];
  if (!first) return { lat: 0, lng: 0 };
  const clamped = Math.min(1, Math.max(0, progress));
  const exact = clamped * (points.length - 1);
  const index = Math.floor(exact);
  const current = points[index] ?? first;
  const next = points[Math.min(points.length - 1, index + 1)] ?? current;
  const t = exact - index;
  return {
    lat: current.lat + (next.lat - current.lat) * t,
    lng: current.lng + (next.lng - current.lng) * t,
  };
}

export function polylineBounds(points: LatLng[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

export function jitterAround(center: LatLng, seed: string, spread = 0.012): LatLng {
  const r1 = seededRandom(`${seed}-a`);
  const r2 = seededRandom(`${seed}-b`);
  return {
    lat: center.lat + (r1 - 0.5) * spread * 2,
    lng: center.lng + (r2 - 0.5) * spread * 2,
  };
}
