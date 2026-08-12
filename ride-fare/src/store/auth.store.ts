import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { clearTokens, setTokens } from "@/api/api";
import type { AuthSession, User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  pendingVerificationPhone: string | null;
  setSession: (session: AuthSession) => void;
  setUser: (user: User) => void;
  setPendingVerificationPhone: (phone: string | null) => void;
  clearSession: () => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isHydrated: false,
      pendingVerificationPhone: null,
      setSession: (session) => {
        setTokens(session.tokens);
        set({ user: session.user, accessToken: session.tokens.accessToken });
      },
      setUser: (user) => set({ user }),
      setPendingVerificationPhone: (phone) => set({ pendingVerificationPhone: phone }),
      clearSession: () => {
        clearTokens();
        set({ user: null, accessToken: null, pendingVerificationPhone: null });
      },
      markHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "ridex.auth",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        pendingVerificationPhone: state.pendingVerificationPhone,
      }),
    },
  ),
);
