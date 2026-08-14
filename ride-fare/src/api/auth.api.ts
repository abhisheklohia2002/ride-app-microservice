import { http } from "./api";
import type { AuthSession, AuthTokens, User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role:string;
}

export interface RegisterResult {
  verificationRequired: boolean;
  phone: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    http.post<any>("/auth/login", payload),

  register: (payload: RegisterPayload) =>
    http.post<RegisterResult>("/auth/register", payload),

  verifyOtp: (payload: { code: string }) =>
    http.post<AuthSession>("/auth/verify-otp", payload),

  resendOtp: () =>
    http.post<{ sent: boolean }>("/auth/resend-otp"),

  forgotPassword: (payload: { email: string }) =>
    http.post<{ sent: boolean; email: string }>(
      "/auth/forgot-password",
      payload
    ),

  resetPassword: (payload: { token?: string; password: string }) =>
    http.post<{ updated: boolean }>("/auth/reset-password", payload),

  refresh: (payload: { refreshToken: string }) =>
    http.post<AuthTokens>("/auth/refresh", payload),

  logout: () =>
    http.post<{ ok: boolean }>("/auth/logout"),

  me: () =>
    http.get<User>("/auth/me"),
};
