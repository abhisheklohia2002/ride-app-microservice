import { PAYMENT_METHODS, PLACE_DIRECTORY, PROMOTIONS, RIDE_CATEGORIES, SAVED_PLACES } from "@/constants";
import type {
  AppSettings,
  AuthSession,
  Driver,
  FareBreakdown,
  Place,
  Ride,
  RideCategoryId,
  RideOption,
  RouteEstimate,
  User,
} from "@/types";
import { buildPolyline, haversineKm, jitterAround, seededRandom } from "@/utils/geo";

/**
 * In-memory mock database backing the Axios mock adapter. It exists purely so
 * the app has realistic data before the Golang service is available; swapping
 * to the real backend means flipping VITE_USE_MOCK_API to "false".
 */

const DRIVER_SEEDS = [
  {
    name: "Rohit Verma",
    vehicleModel: "Maruti Swift",
    vehicleNumber: "KA 05 MJ 4471",
    vehicleColor: "Pearl White",
    rating: 4.93,
    trips: 4120,
  },
  {
    name: "Anita Shetty",
    vehicleModel: "Hyundai Aura",
    vehicleNumber: "KA 03 AB 9021",
    vehicleColor: "Midnight Blue",
    rating: 4.88,
    trips: 2860,
  },
  {
    name: "Imran Khan",
    vehicleModel: "Toyota Innova Crysta",
    vehicleNumber: "KA 51 CD 7734",
    vehicleColor: "Silver",
    rating: 4.96,
    trips: 6310,
  },
  {
    name: "Sneha Rao",
    vehicleModel: "Honda City",
    vehicleNumber: "KA 41 HH 2288",
    vehicleColor: "Graphite",
    rating: 4.9,
    trips: 3390,
  },
  {
    name: "Dev Patel",
    vehicleModel: "Bajaj Auto",
    vehicleNumber: "KA 02 AE 1190",
    vehicleColor: "Yellow",
    rating: 4.79,
    trips: 8120,
  },
];

interface MockDb {
  user: User;
  settings: AppSettings;
  savedPlaces: Place[];
  recentPlaces: Place[];
  rides: Ride[];
  activeRideId: string | null;
  pendingSignupEmail: string | null;
  counter: number;
}

let db: MockDb | null = null;

function makeUser(): User {
  return {
    id: "usr_9f13",
    fullName: "Aarav Mehta",
    email: "aarav@ridex.app",
    phone: "+91 98450 21188",
    avatarUrl: "",
    rating: 4.91,
    memberSince: "2021-03-14T00:00:00.000Z",
    language: "English",
    emergencyContact: { name: "Nisha Mehta", phone: "+91 98860 77441", relation: "Sister" },
  };
}

export function driverForCategory(category: RideCategoryId, seed: string): Driver {
  const index =
    category === "auto" || category === "bike"
      ? 4
      : category === "suv"
        ? 2
        : Math.floor(seededRandom(seed) * 4) % 4;
  const base = DRIVER_SEEDS[index] ?? DRIVER_SEEDS[0]!;
  return {
    id: `drv_${index}_${seed.slice(-4)}`,
    name: base.name,
    avatarUrl: "",
    rating: base.rating,
    trips: base.trips,
    vehicleModel: base.vehicleModel,
    vehicleNumber: base.vehicleNumber,
    vehicleColor: base.vehicleColor,
    phone: "+91 90000 12345",
    coords: { lat: 12.9719, lng: 77.6412 },
  };
}

function makeSeedRides(): Ride[] {
  const trips: Array<{ from: string; to: string; category: RideCategoryId; daysAgo: number }> = [
    { from: "p-home", to: "p-work", category: "go", daysAgo: 1 },
    { from: "p-work", to: "p-home", category: "sedan", daysAgo: 2 },
    { from: "p-home", to: "p-airport", category: "suv", daysAgo: 6 },
    { from: "p-mg", to: "p-hsr", category: "auto", daysAgo: 11 },
    { from: "p-home", to: "p-ub", category: "luxury", daysAgo: 18 },
    { from: "p-gym", to: "p-home", category: "bike", daysAgo: 24 },
  ];

  return trips.map((trip, i) => {
    const pickup = PLACE_DIRECTORY.find((p) => p.id === trip.from) ?? SAVED_PLACES[0]!;
    const destination = PLACE_DIRECTORY.find((p) => p.id === trip.to) ?? SAVED_PLACES[1]!;
    const route = estimateRoute(pickup, destination);
    const breakdown = computeFare(trip.category, route, i % 3 === 0 ? "RIDEX40" : undefined, 0);
    const requestedAt = new Date(Date.now() - trip.daysAgo * 86_400_000).toISOString();
    const method = PAYMENT_METHODS[i % PAYMENT_METHODS.length]!;
    return {
      id: `ride_seed_${i + 1}`,
      code: `RX${1200 + i}`,
      status: i === 3 ? "cancelled" : "completed",
      category: trip.category,
      categoryName: RIDE_CATEGORIES.find((c) => c.id === trip.category)?.name ?? "RideX Go",
      pickup,
      destination,
      route,
      driver: driverForCategory(trip.category, `seed-${i}`),
      otp: `${1000 + i * 7}`,
      fare: breakdown.total,
      fareBreakdown: breakdown,
      paymentMethod: method.id,
      promoCode: i % 3 === 0 ? "RIDEX40" : undefined,
      requestedAt,
      completedAt: new Date(Date.parse(requestedAt) + route.durationMinutes * 60_000).toISOString(),
      paid: i !== 3,
    } satisfies Ride;
  });
}

export function getDb(): MockDb {
  if (!db) {
    db = {
      user: makeUser(),
      settings: {
        pushNotifications: true,
        rideUpdates: true,
        promotions: false,
        shareTripData: true,
        biometricLock: false,
      },
      savedPlaces: [...SAVED_PLACES],
      recentPlaces: [
        PLACE_DIRECTORY.find((p) => p.id === "p-airport")!,
        PLACE_DIRECTORY.find((p) => p.id === "p-mg")!,
        PLACE_DIRECTORY.find((p) => p.id === "p-phoenix")!,
      ],
      rides: makeSeedRides(),
      activeRideId: null,
      pendingSignupEmail: null,
      counter: 1,
    };
  }
  return db;
}

export function nextId(prefix: string): string {
  const store = getDb();
  store.counter += 1;
  return `${prefix}_${Date.now().toString(36)}${store.counter}`;
}

export function estimateRoute(from: Place, to: Place): RouteEstimate {
  const straight = haversineKm(from.coords, to.coords);
  const distanceKm = Math.max(0.8, Number((straight * 1.28).toFixed(2)));
  const trafficFactor = 2.4 + seededRandom(`${from.id}${to.id}`) * 1.2;
  return {
    distanceKm,
    durationMinutes: Math.max(4, Math.round(distanceKm * trafficFactor)),
    polyline: buildPolyline(from.coords, to.coords),
  };
}

export function computeFare(
  category: RideCategoryId,
  route: RouteEstimate,
  promoCode: string | undefined,
  tip: number,
): FareBreakdown {
  const meta = RIDE_CATEGORIES.find((c) => c.id === category) ?? RIDE_CATEGORIES[2]!;
  const base = meta.baseFare;
  const distance = Math.round(route.distanceKm * meta.perKm);
  const time = Math.round(route.durationMinutes * meta.perMin);
  const surgeMultiplier = seededRandom(`${category}-surge`) > 0.72 ? 1.2 : 1;
  const surge = Math.round((base + distance + time) * (surgeMultiplier - 1));
  const subtotal = base + distance + time + surge;
  const taxes = Math.round(subtotal * 0.05);
  const promo = promoCode ? PROMOTIONS.find((p) => p.code === promoCode.toUpperCase()) : undefined;
  const discount = promo
    ? Math.min(promo.maxDiscount, Math.round((subtotal * promo.discountPercent) / 100))
    : 0;
  const total = Math.max(0, subtotal + taxes - discount + tip);
  return { base, distance, time, surge, taxes, discount, tip, total };
}

export function buildRideOptions(route: RouteEstimate): RideOption[] {
  return RIDE_CATEGORIES.map((meta) => {
    const fare = computeFare(meta.id, route, undefined, 0).total;
    const hasDeal = seededRandom(`${meta.id}-deal`) > 0.55;
    return {
      id: meta.id,
      name: meta.name,
      tagline: meta.tagline,
      seats: meta.seats,
      etaMinutes: meta.etaMinutes + Math.round(seededRandom(`${meta.id}-eta`) * 3),
      fare,
      originalFare: hasDeal ? Math.round(fare * 1.14) : undefined,
      multiplier: meta.multiplier,
    } satisfies RideOption;
  });
}

export function makeSession(user: User): AuthSession {
  return {
    user,
    tokens: {
      accessToken: `mock.access.${Date.now().toString(36)}`,
      refreshToken: `mock.refresh.${Date.now().toString(36)}`,
      expiresIn: 900,
    },
  };
}

export function nearbyDrivers(center: Place, count = 6): Driver[] {
  return Array.from({ length: count }, (_, i) => {
    const seedBase = DRIVER_SEEDS[i % DRIVER_SEEDS.length]!;
    return {
      id: `nearby_${i}`,
      name: seedBase.name,
      avatarUrl: "",
      rating: seedBase.rating,
      trips: seedBase.trips,
      vehicleModel: seedBase.vehicleModel,
      vehicleNumber: seedBase.vehicleNumber,
      vehicleColor: seedBase.vehicleColor,
      phone: "+91 90000 12345",
      coords: jitterAround(center.coords, `nearby-${i}`),
    } satisfies Driver;
  });
}
