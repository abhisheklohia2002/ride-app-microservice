import { api } from "../../lib/axios";

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from "./types/auth.types";

export const register = async (
  payload: RegisterRequest,
) => {
  const { data } = await api.post<AuthResponse>(
    "/api/auth/register",
    payload,
  );

  return data;
};

export const login = async (
  payload: LoginRequest,
) => {
  const { data } = await api.post<AuthResponse>(
    "/api/auth/login",
    payload,
  );

  return data;
};

export const logout = async () => {
  const { data } = await api.post(
    "/api/auth/logout",
  );

  return data;
};

export const getMe = async () => {
  const { data } = await api.get<AuthResponse>(
    "/api/auth/me",
  );

  return data;
};