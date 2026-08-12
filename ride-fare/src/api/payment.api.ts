import { http } from "./api";
import type { PaymentMethod, PaymentMethodId, Promotion, Ride } from "@/types";

export const paymentApi = {
  methods: () => http.get<PaymentMethod[]>("/payments/methods"),
  promotions: () => http.get<Promotion[]>("/payments/promotions"),
  validatePromo: (code: string) => http.post<Promotion>("/payments/promo/validate", { code }),
  pay: (payload: { rideId: string; method: PaymentMethodId; tip: number }) =>
    http.post<Ride>(`/payments/${payload.rideId}/pay`, {
      method: payload.method,
      tip: payload.tip,
    }),
};
