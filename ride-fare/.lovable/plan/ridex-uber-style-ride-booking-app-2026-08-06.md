# RideX — Uber-style Ride Booking App

A premium, mobile-first ride-hailing frontend with the complete booking journey: auth → home → search → ride selection → confirm → finding driver → live tracking → payment → receipt, plus history, profile, settings and support.

## Stack decisions (two substitutions)

Your stack is honoured with two unavoidable swaps, since this project runs on Lovable's fixed React 19 + TypeScript + Vite framework:

- **Routing:** TanStack Router (file-based) instead of React Router DOM. Router choice is fixed at the platform level. All requested routes, plus `ProtectedRoute`/`GuestRoute` gating, are implemented with equivalent guards.
- **Toasts:** Sonner instead of React Hot Toast (already installed, same API surface).

Everything else is exactly as specified: Axios, TanStack Query, Zustand, Tailwind, React Hook Form, Zod, Lucide, Framer Motion.

## Data layer

There is no Golang backend yet, so the app ships with a **fully typed mock transport**: real Axios instance, real interceptors, real typed API modules — with an in-memory mock adapter that returns realistic data and simulated latency. When your Go service is live, you set `VITE_API_BASE_URL` and turn the mock flag off; **no component or hook changes needed**.

## Maps

A **stylized custom map** (SVG/canvas layers with animated route polyline, vehicle markers and driver movement) plus mock geocoding/autocomplete over a curated place dataset. No API key required, works offline, and looks intentionally designed rather than a grey tile screenshot. Swapping in Google Maps later touches only `MapCanvas` and `location.api.ts`.

## Design direction

Dark-first premium: near-black canvas, warm off-white type, a single electric-lime accent for actions and route lines. Tight geometric display type for numbers/fares, clean grotesque for body. Bottom sheets, floating map controls, glass surfaces, soft depth, spring-based transitions. Verified at 320 / 375 / 390 / 430 / 768 / 1024 / 1440 with safe-area insets.

## Build phases

**1. Foundation** — design tokens, Axios instance + interceptors + refresh queue, mock transport, Zustand stores (auth, ride, ui), query client, route shell, layouts, bottom nav.

**2. Component library** — Button, Input, SearchInput, OTPInput, Avatar, Badge, Chip, Modal, Drawer/BottomSheet, Loader, Skeleton, RideCard, DriverCard, MapCard, EmptyState, ErrorState.

**3. Auth** — login, signup, OTP verification, forgot/reset password; RHF + Zod schemas; guest/protected gating.

**4. Core booking flow** — home (search entry, current location, suggestions, saved places, recent rides, promos), search with live autocomplete + distance/duration estimates, ride selection (Go, Sedan, SUV, Luxury, Bike, Auto with animated selection), confirm ride (map, fare, promo, payment method), finding driver (animated radar search, nearby drivers, cancel), live tracking (moving driver, OTP, call/chat/SOS, trip status).

**5. Payment & post-ride** — method selection (UPI/Card/Wallet/Cash), fare breakdown, promo, tipping, receipt.

**6. Remaining screens** — ride history (repeat ride, invoice), profile (avatar, contacts, addresses, payment methods, language), settings (dark mode, notifications, privacy, delete account), support, 404.

## Technical notes

- Feature-based structure: `src/api`, `src/features/*`, `src/components`, `src/hooks`, `src/layouts`, `src/store`, `src/types`, `src/utils`, `src/constants`. Route files live in `src/routes/` (framework requirement) and are thin wrappers that render feature screens.
- Axios: base URL from env, JWT attach on request, 401 → single-flight refresh with request replay, typed `ApiResponse<T>` envelope, timeout, normalized error mapping.
- TanStack Query owns all server state — `useQuery`, `useMutation`, `invalidateQueries`, optimistic updates for tipping/cancel, infinite query for ride history. No `useEffect` fetching.
- Zustand holds only client state: user, token, selected ride, pickup, destination, ride status, driver, theme, notification count.
- Ride lifecycle simulation lives behind a `useRideSimulation` hook that mimics a WebSocket channel, so the real socket drops in without UI changes.
- Each route gets its own `head()` metadata; every route with a loader gets error and not-found boundaries.
