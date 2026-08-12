export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  locations: {
    autocomplete: (query: string) => ["locations", "autocomplete", query] as const,
    saved: ["locations", "saved"] as const,
    recent: ["locations", "recent"] as const,
    current: ["locations", "current"] as const,
    route: (pickupId?: string, destinationId?: string) =>
      ["locations", "route", pickupId ?? null, destinationId ?? null] as const,
  },
  rides: {
    all: ["rides"] as const,
    estimates: (pickupId?: string, destinationId?: string) =>
      ["rides", "estimates", pickupId ?? null, destinationId ?? null] as const,
    nearby: (pickupId?: string) => ["rides", "nearby", pickupId ?? null] as const,
    active: ["rides", "active"] as const,
    detail: (id: string) => ["rides", "detail", id] as const,
    history: ["rides", "history"] as const,
  },
  payments: {
    methods: ["payments", "methods"] as const,
    promotions: ["payments", "promotions"] as const,
  },
  profile: {
    detail: ["profile", "detail"] as const,
    settings: ["profile", "settings"] as const,
    languages: ["profile", "languages"] as const,
  },
} as const;
