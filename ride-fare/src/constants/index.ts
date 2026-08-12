import type { PaymentMethod, Place, Promotion, RideCategoryId } from "@/types";

export const APP_NAME = "RideX";

export const ROUTE_PATHS = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  otp: "/verify-otp",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  home: "/home",
  search: "/search",
  confirmRide: "/confirm-ride",
  findingDriver: "/finding-driver",
  ride: "/ride",
  payment: "/payment",
  history: "/history",
  profile: "/profile",
  settings: "/settings",
  support: "/support",
} as const;

export interface RideCategoryMeta {
  id: RideCategoryId;
  name: string;
  tagline: string;
  seats: number;
  multiplier: number;
  baseFare: number;
  perKm: number;
  perMin: number;
  etaMinutes: number;
}

export const RIDE_CATEGORIES: RideCategoryMeta[] = [
  {
    id: "bike",
    name: "Bike",
    tagline: "Beat the traffic, solo and fast",
    seats: 1,
    multiplier: 0.55,
    baseFare: 15,
    perKm: 6,
    perMin: 1,
    etaMinutes: 2,
  },
  {
    id: "auto",
    name: "Auto",
    tagline: "Three wheels, no haggling",
    seats: 3,
    multiplier: 0.75,
    baseFare: 22,
    perKm: 9,
    perMin: 1.2,
    etaMinutes: 3,
  },
  {
    id: "go",
    name: "RideX Go",
    tagline: "Affordable everyday hatchbacks",
    seats: 4,
    multiplier: 1,
    baseFare: 35,
    perKm: 13,
    perMin: 1.6,
    etaMinutes: 4,
  },
  {
    id: "sedan",
    name: "Sedan",
    tagline: "Extra legroom and boot space",
    seats: 4,
    multiplier: 1.28,
    baseFare: 48,
    perKm: 16,
    perMin: 2,
    etaMinutes: 5,
  },
  {
    id: "suv",
    name: "SUV",
    tagline: "Six seats for the whole crew",
    seats: 6,
    multiplier: 1.65,
    baseFare: 62,
    perKm: 21,
    perMin: 2.4,
    etaMinutes: 7,
  },
  {
    id: "luxury",
    name: "Luxury",
    tagline: "Premium cars, top-rated captains",
    seats: 4,
    multiplier: 2.3,
    baseFare: 120,
    perKm: 32,
    perMin: 3.4,
    etaMinutes: 9,
  },
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "upi", label: "UPI", detail: "ridex@okbank" },
  { id: "card", label: "Card", detail: "Visa •••• 4291" },
  { id: "wallet", label: "RideX Wallet", detail: "Balance ₹1,240" },
  { id: "cash", label: "Cash", detail: "Pay the captain directly" },
];

export const SAVED_PLACES: Place[] = [
  {
    id: "p-home",
    name: "Home",
    address: "12A, Dover Terrace, Indiranagar",
    coords: { lat: 12.9719, lng: 77.6412 },
    category: "home",
  },
  {
    id: "p-work",
    name: "Work",
    address: "Prestige Tech Park, Outer Ring Road",
    coords: { lat: 12.9351, lng: 77.6916 },
    category: "work",
  },
  {
    id: "p-gym",
    name: "Cult Fitness",
    address: "100 Feet Road, Koramangala",
    coords: { lat: 12.9352, lng: 77.6245 },
    category: "favorite",
  },
];

export const PLACE_DIRECTORY: Place[] = [
  ...SAVED_PLACES,
  {
    id: "p-airport",
    name: "Kempegowda International Airport",
    address: "Terminal 2, Devanahalli",
    coords: { lat: 13.1986, lng: 77.7066 },
    category: "poi",
  },
  {
    id: "p-mg",
    name: "MG Road Metro",
    address: "Mahatma Gandhi Road, Shivaji Nagar",
    coords: { lat: 12.9756, lng: 77.6068 },
    category: "poi",
  },
  {
    id: "p-phoenix",
    name: "Phoenix Mall of Asia",
    address: "Byatarayanapura, Hebbal",
    coords: { lat: 13.0509, lng: 77.5945 },
    category: "poi",
  },
  {
    id: "p-lalbagh",
    name: "Lalbagh Botanical Garden",
    address: "Mavalli, South Bengaluru",
    coords: { lat: 12.9507, lng: 77.5848 },
    category: "poi",
  },
  {
    id: "p-cubbon",
    name: "Cubbon Park",
    address: "Kasturba Road, Sampangi Rama Nagar",
    coords: { lat: 12.9763, lng: 77.5929 },
    category: "poi",
  },
  {
    id: "p-whitefield",
    name: "Whitefield ITPL",
    address: "International Tech Park, Whitefield",
    coords: { lat: 12.9856, lng: 77.7365 },
    category: "poi",
  },
  {
    id: "p-hsr",
    name: "HSR Layout Sector 2",
    address: "27th Main Road, HSR Layout",
    coords: { lat: 12.9121, lng: 77.6446 },
    category: "poi",
  },
  {
    id: "p-jayanagar",
    name: "Jayanagar 4th Block",
    address: "Cool Joint Road, Jayanagar",
    coords: { lat: 12.9299, lng: 77.5826 },
    category: "poi",
  },
  {
    id: "p-station",
    name: "KSR Bengaluru City Junction",
    address: "Railway Station Road, Majestic",
    coords: { lat: 12.9784, lng: 77.5709 },
    category: "poi",
  },
  {
    id: "p-ub",
    name: "UB City",
    address: "Vittal Mallya Road, Ashok Nagar",
    coords: { lat: 12.9719, lng: 77.5959 },
    category: "poi",
  },
];

export const PROMOTIONS: Promotion[] = [
  {
    id: "promo-1",
    code: "RIDEX40",
    title: "40% off your next 3 rides",
    description: "Up to ₹120 off on Go and Sedan",
    discountPercent: 40,
    maxDiscount: 120,
    accent: "lime",
  },
  {
    id: "promo-2",
    code: "AIRPORT99",
    title: "Flat ₹99 off airport trips",
    description: "Valid on SUV and Luxury before 9am",
    discountPercent: 15,
    maxDiscount: 99,
    accent: "violet",
  },
  {
    id: "promo-3",
    code: "LATENIGHT",
    title: "No surge after midnight",
    description: "Auto and Bike rides, 12am – 5am",
    discountPercent: 20,
    maxDiscount: 60,
    accent: "amber",
  },
];

export const SUPPORT_TOPICS = [
  { id: "s1", title: "I left an item in the car", detail: "Report a lost item and reach your captain" },
  { id: "s2", title: "My fare looks wrong", detail: "Request a fare review for a recent trip" },
  { id: "s3", title: "Driver behaviour", detail: "Tell us what happened on your trip" },
  { id: "s4", title: "Payment or refund issue", detail: "Failed payments, double charges, refunds" },
  { id: "s5", title: "Account and login", detail: "Password, OTP and phone number changes" },
];

export const LANGUAGES = ["English", "हिन्दी", "ಕನ್ನಡ", "தமிழ்", "తెలుగు", "Español"];
