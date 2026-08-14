// Shared domain types. These mirror the contracts a future Golang backend
// (Gin/Fiber + PostgreSQL) is expected to expose over REST/WebSockets.

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorShape {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string> | undefined;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  full_Name: string;
  email: string;
  phone: string;
  avatarUrl?: string | undefined;
  rating: number;
  memberSince: string;
  emergencyContact?: EmergencyContact | undefined;
  language: string;
}

export interface UserResponse {
  id: number;
  full_name: string;
  role: string;
  phone: string;
  email: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface AuthSession {
  user: User;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type PlaceCategory = "home" | "work" | "favorite" | "recent" | "poi";

export interface Place {
  id: string;
  name: string;
  address: string;
  coords: LatLng;
  category: PlaceCategory;
}

export type RideCategoryId = "go" | "sedan" | "suv" | "luxury" | "bike" | "auto";

export interface RideOption {
  id: RideCategoryId;
  name: string;
  tagline: string;
  seats: number;
  etaMinutes: number;
  fare: number;
  originalFare?: number | undefined;
  surge?: number | undefined;
  multiplier: number;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  polyline: LatLng[];
}

export interface Driver {
  id: string;
  name: string;
  avatarUrl: string;
  rating: number;
  trips: number;
  vehicleModel: string;
  vehicleNumber: string;
  vehicleColor: string;
  phone: string;
  coords: LatLng;
}

export type RideStatus =
  | "idle"
  | "searching"
  | "accepted"
  | "arriving"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentMethodId = "upi" | "card" | "wallet" | "cash";

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  detail: string;
}

export interface FareBreakdown {
  base: number;
  distance: number;
  time: number;
  surge: number;
  taxes: number;
  discount: number;
  tip: number;
  total: number;
}

export interface Ride {
  id: string;
  code: string;
  status: RideStatus;
  category: RideCategoryId;
  categoryName: string;
  pickup: Place;
  destination: Place;
  route: RouteEstimate;
  driver?: Driver | undefined;
  otp: string;
  fare: number;
  fareBreakdown: FareBreakdown;
  paymentMethod: PaymentMethodId;
  promoCode?: string | undefined;
  requestedAt: string;
  completedAt?: string | undefined;
  paid: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  maxDiscount: number;
  accent: string;
}

export interface AppSettings {
  pushNotifications: boolean;
  rideUpdates: boolean;
  promotions: boolean;
  shareTripData: boolean;
  biometricLock: boolean;
}
