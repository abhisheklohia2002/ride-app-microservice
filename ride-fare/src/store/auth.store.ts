import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { UserResponse } from "@/types";

interface AuthState {
  user: UserResponse | null;
  isHydrated: boolean;
  pendingVerificationPhone: string | null;

  setUser: (user: UserResponse) => void;
  setPendingVerificationPhone: (phone: string | null) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
      pendingVerificationPhone: null,

      setUser: (user) => set({ user }),

      setPendingVerificationPhone: (phone) =>
        set({
          pendingVerificationPhone: phone,
        }),

      clearSession: () =>
        set({
          user: null,
          pendingVerificationPhone: null,
        }),

      markHydrated: () =>
        set({
          isHydrated: true,
        }),
    }),
    {
      name: "ridex.auth",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({
        user: state.user,
        pendingVerificationPhone: state.pendingVerificationPhone,
      }),
    },
  ),
);