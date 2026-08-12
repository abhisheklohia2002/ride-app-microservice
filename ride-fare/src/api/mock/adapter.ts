import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";

import { LANGUAGES, PAYMENT_METHODS, PLACE_DIRECTORY, PROMOTIONS } from "@/constants";
import type { ApiResponse, Place, Ride, RideCategoryId, RideStatus } from "@/types";
import {
  buildRideOptions,
  computeFare,
  driverForCategory,
  estimateRoute,
  getDb,
  makeSession,
  nearbyDrivers,
  nextId,
} from "./db";
import { RIDE_CATEGORIES } from "@/constants";

interface HandlerContext {
  body: Record<string, unknown>;
  params: Record<string, string>;
  query: URLSearchParams;
}

type Handler = (ctx: HandlerContext) => unknown;

class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

const routes = new Map<string, Handler>();

function route(key: string, handler: Handler) {
  routes.set(key, handler);
}

function requirePlace(id: unknown): Place {
  const store = getDb();
  const all = [...PLACE_DIRECTORY, ...store.savedPlaces, ...store.recentPlaces];
  const found = all.find((p) => p.id === id);
  if (!found) throw new MockHttpError(404, "place_not_found", "That place no longer exists.");
  return found;
}

function placeFromPayload(value: unknown): Place {
  if (value && typeof value === "object" && "coords" in value) return value as Place;
  return requirePlace(value);
}

function requireRide(id: string): Ride {
  const ride = getDb().rides.find((r) => r.id === id);
  if (!ride) throw new MockHttpError(404, "ride_not_found", "Ride not found.");
  return ride;
}

/* ---------------------------------- auth --------------------------------- */

route("POST /auth/login", ({ body }) => {
  const email = String(body["email"] ?? "");
  const password = String(body["password"] ?? "");
  if (password.length < 6) {
    throw new MockHttpError(401, "invalid_credentials", "Incorrect email or password.", {
      password: "Incorrect email or password",
    });
  }
  const store = getDb();
  store.user = { ...store.user, email: email || store.user.email };
  return makeSession(store.user);
});

route("POST /auth/register", ({ body }) => {
  const store = getDb();
  store.pendingSignupEmail = String(body["email"] ?? "");
  store.user = {
    ...store.user,
    fullName: String(body["fullName"] ?? store.user.fullName),
    email: String(body["email"] ?? store.user.email),
    phone: String(body["phone"] ?? store.user.phone),
  };
  return { verificationRequired: true, phone: store.user.phone };
});

route("POST /auth/verify-otp", ({ body }) => {
  const code = String(body["code"] ?? "");
  if (!/^\d{6}$/.test(code)) {
    throw new MockHttpError(422, "invalid_otp", "Enter the 6-digit code we sent you.");
  }
  return makeSession(getDb().user);
});

route("POST /auth/resend-otp", () => ({ sent: true }));

route("POST /auth/forgot-password", ({ body }) => ({
  sent: true,
  email: String(body["email"] ?? ""),
}));

route("POST /auth/reset-password", ({ body }) => {
  const password = String(body["password"] ?? "");
  if (password.length < 8) {
    throw new MockHttpError(422, "weak_password", "Use at least 8 characters.");
  }
  return { updated: true };
});

route("POST /auth/refresh", ({ body }) => {
  if (!body["refreshToken"]) {
    throw new MockHttpError(401, "invalid_refresh_token", "Session expired. Please sign in again.");
  }
  return makeSession(getDb().user).tokens;
});

route("POST /auth/logout", () => {
  getDb().activeRideId = null;
  return { ok: true };
});

route("GET /auth/me", () => getDb().user);

/* -------------------------------- locations ------------------------------- */

route("GET /locations/autocomplete", ({ query }) => {
  const q = (query.get("q") ?? "").trim().toLowerCase();
  const store = getDb();
  const pool = [...store.savedPlaces, ...PLACE_DIRECTORY].filter(
    (place, index, arr) => arr.findIndex((p) => p.id === place.id) === index,
  );
  if (!q) return pool.slice(0, 6);
  return pool
    .filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    )
    .slice(0, 8);
});

route("GET /locations/saved", () => getDb().savedPlaces);

route("POST /locations/saved", ({ body }) => {
  const store = getDb();
  const place = placeFromPayload(body["place"] ?? body);
  const saved: Place = { ...place, id: nextId("place"), category: "favorite" };
  store.savedPlaces = [...store.savedPlaces, saved];
  return saved;
});

route("DELETE /locations/saved/:id", ({ params }) => {
  const store = getDb();
  store.savedPlaces = store.savedPlaces.filter((p) => p.id !== params["id"]);
  return { deleted: true };
});

route("GET /locations/recent", () => getDb().recentPlaces);

route("GET /locations/current", () => getDb().savedPlaces[0] ?? PLACE_DIRECTORY[0]);

route("POST /locations/route", ({ body }) => {
  const pickup = placeFromPayload(body["pickup"]);
  const destination = placeFromPayload(body["destination"]);
  return estimateRoute(pickup, destination);
});

/* ---------------------------------- rides -------------------------------- */

route("POST /rides/estimates", ({ body }) => {
  const pickup = placeFromPayload(body["pickup"]);
  const destination = placeFromPayload(body["destination"]);
  return buildRideOptions(estimateRoute(pickup, destination));
});

route("GET /rides/nearby-drivers", ({ query }) => {
  const store = getDb();
  const pickupId = query.get("pickupId");
  const pickup = store.savedPlaces.find((p) => p.id === pickupId) ?? store.savedPlaces[0]!;
  return nearbyDrivers(pickup);
});

route("POST /rides", ({ body }) => {
  const store = getDb();
  const pickup = placeFromPayload(body["pickup"]);
  const destination = placeFromPayload(body["destination"]);
  const category = (body["category"] as RideCategoryId) ?? "go";
  const promoCode = body["promoCode"] ? String(body["promoCode"]) : undefined;
  const route_ = estimateRoute(pickup, destination);
  const breakdown = computeFare(category, route_, promoCode, 0);
  const id = nextId("ride");
  const ride: Ride = {
    id,
    code: `RX${1300 + store.rides.length}`,
    status: "searching",
    category,
    categoryName: RIDE_CATEGORIES.find((c) => c.id === category)?.name ?? "RideX Go",
    pickup,
    destination,
    route: route_,
    otp: String(1000 + Math.floor(Number(id.replace(/\D/g, "").slice(-4) || 0) % 8999)),
    fare: breakdown.total,
    fareBreakdown: breakdown,
    paymentMethod: (body["paymentMethod"] as Ride["paymentMethod"]) ?? "upi",
    promoCode,
    requestedAt: new Date().toISOString(),
    paid: false,
  };
  store.rides = [ride, ...store.rides];
  store.activeRideId = ride.id;
  if (!store.recentPlaces.some((p) => p.id === destination.id)) {
    store.recentPlaces = [destination, ...store.recentPlaces].slice(0, 6);
  }
  return ride;
});

route("GET /rides/active", () => {
  const store = getDb();
  return store.rides.find((r) => r.id === store.activeRideId) ?? null;
});

route("GET /rides/history", ({ query }) => {
  const page = Number(query.get("page") ?? 1);
  const pageSize = Number(query.get("pageSize") ?? 4);
  const finished = getDb().rides.filter(
    (r) => r.status === "completed" || r.status === "cancelled",
  );
  const start = (page - 1) * pageSize;
  const items = finished.slice(start, start + pageSize);
  return {
    items,
    page,
    pageSize,
    total: finished.length,
    hasMore: start + pageSize < finished.length,
  };
});

route("GET /rides/:id", ({ params }) => requireRide(params["id"] ?? ""));

route("POST /rides/:id/assign", ({ params }) => {
  const ride = requireRide(params["id"] ?? "");
  ride.driver = {
    ...driverForCategory(ride.category, ride.id),
    coords: ride.route.polyline[0] ?? ride.pickup.coords,
  };
  ride.status = "arriving";
  return ride;
});

route("PATCH /rides/:id/status", ({ params, body }) => {
  const ride = requireRide(params["id"] ?? "");
  const status = body["status"] as RideStatus;
  ride.status = status;
  if (status === "completed") {
    ride.completedAt = new Date().toISOString();
    getDb().activeRideId = ride.id;
  }
  return ride;
});

route("POST /rides/:id/cancel", ({ params, body }) => {
  const ride = requireRide(params["id"] ?? "");
  ride.status = "cancelled";
  ride.completedAt = new Date().toISOString();
  const store = getDb();
  store.activeRideId = null;
  return { ride, reason: String(body["reason"] ?? "changed_plans") };
});

/* -------------------------------- payments -------------------------------- */

route("GET /payments/methods", () => PAYMENT_METHODS);

route("GET /payments/promotions", () => PROMOTIONS);

route("POST /payments/promo/validate", ({ body }) => {
  const code = String(body["code"] ?? "").toUpperCase();
  const promo = PROMOTIONS.find((p) => p.code === code);
  if (!promo) {
    throw new MockHttpError(404, "promo_invalid", `“${code}” is not a valid promo code.`);
  }
  return promo;
});

route("POST /payments/:rideId/pay", ({ params, body }) => {
  const ride = requireRide(params["rideId"] ?? "");
  const tip = Number(body["tip"] ?? 0);
  ride.paymentMethod = (body["method"] as Ride["paymentMethod"]) ?? ride.paymentMethod;
  ride.fareBreakdown = computeFare(ride.category, ride.route, ride.promoCode, tip);
  ride.fare = ride.fareBreakdown.total;
  ride.paid = true;
  ride.status = "completed";
  ride.completedAt = ride.completedAt ?? new Date().toISOString();
  getDb().activeRideId = null;
  return ride;
});

/* --------------------------------- profile -------------------------------- */

route("GET /profile", () => getDb().user);

route("PATCH /profile", ({ body }) => {
  const store = getDb();
  store.user = { ...store.user, ...(body as Partial<typeof store.user>) };
  return store.user;
});

route("GET /profile/settings", () => getDb().settings);

route("PATCH /profile/settings", ({ body }) => {
  const store = getDb();
  store.settings = { ...store.settings, ...(body as Partial<typeof store.settings>) };
  return store.settings;
});

route("GET /profile/languages", () => LANGUAGES);

route("DELETE /profile", () => {
  db_reset();
  return { deleted: true };
});

function db_reset() {
  const store = getDb();
  store.activeRideId = null;
}

/* --------------------------------- adapter -------------------------------- */

function matchRoute(method: string, pathname: string) {
  for (const [key, handler] of routes) {
    const [routeMethod, routePath] = key.split(" ") as [string, string];
    if (routeMethod !== method) continue;
    const routeParts = routePath.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < routeParts.length; i += 1) {
      const rp = routeParts[i]!;
      const pp = pathParts[i]!;
      if (rp.startsWith(":")) params[rp.slice(1)] = decodeURIComponent(pp);
      else if (rp !== pp) {
        matched = false;
        break;
      }
    }
    if (matched) return { handler, params };
  }
  return null;
}

function parseBody(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return data as Record<string, unknown>;
}

const LATENCY_MS = 320;

export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? "get").toUpperCase();
  const raw = config.url ?? "";
  const [rawPath, rawQuery] = raw.split("?");
  const pathname = (rawPath ?? "").replace(/\/+$/, "") || "/";
  const query = new URLSearchParams(rawQuery ?? "");

  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  const match = matchRoute(method, pathname);
  const respond = (status: number, payload: ApiResponse<unknown>): AxiosResponse => ({
    data: payload,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {},
    config,
  });

  if (!match) {
    return Promise.reject(
      Object.assign(new Error(`No mock handler for ${method} ${pathname}`), {
        isAxiosError: true,
        config,
        response: respond(404, {
          success: false,
          message: `No mock handler for ${method} ${pathname}`,
          data: { code: "not_found" },
        }),
      }),
    );
  }

  try {
    const result = match.handler({ body: parseBody(config.data), params: match.params, query });
    return respond(200, { success: true, data: result });
  } catch (error) {
    const err =
      error instanceof MockHttpError
        ? error
        : new MockHttpError(500, "server_error", "Something went wrong. Please try again.");
    return Promise.reject(
      Object.assign(new Error(err.message), {
        isAxiosError: true,
        config,
        response: respond(err.status, {
          success: false,
          message: err.message,
          data: { code: err.code, fieldErrors: err.fieldErrors },
        }),
      }),
    );
  }
};
