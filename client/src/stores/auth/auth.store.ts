import { create } from "zustand";

export type UserRole =
  | "PASSENGER"
  | "DRIVER";

export type User = {
  id: string | number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
};

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;

  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>(
  (set) => ({
    user: null,
    isAuthenticated: false,

    setUser: (user) =>
      set({
        user,
        isAuthenticated: true,
      }),

    clearUser: () =>
      set({
        user: null,
        isAuthenticated: false,
      }),
  }),
);