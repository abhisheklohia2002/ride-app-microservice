
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  getMe,
  login,
  logout,
  register,
} from "./../api";

import type {
  LoginRequest,
  RegisterRequest,
} from "../types/auth.types";

export const useLogin = () => {
  return useMutation({
    mutationFn: (payload: LoginRequest) =>
      login(payload),
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (payload: RegisterRequest) =>
      register(payload),
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: logout,
  });
};

export const useMe = () => {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
  });
};