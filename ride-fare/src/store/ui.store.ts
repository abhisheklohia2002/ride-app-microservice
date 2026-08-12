import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

interface UiState {
  theme: ThemeMode;
  notificationCount: number;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setNotificationCount: (count: number) => void;
  clearNotifications: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      notificationCount: 3,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setNotificationCount: (count) => set({ notificationCount: count }),
      clearNotifications: () => set({ notificationCount: 0 }),
    }),
    {
      name: "ridex.ui",
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
