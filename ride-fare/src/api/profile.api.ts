import { http } from "./api";
import type { AppSettings, User } from "@/types";

export const profileApi = {
  get: () => http.get<User>("/profile"),
  update: (payload: Partial<User>) => http.patch<User>("/profile", payload),
  settings: () => http.get<AppSettings>("/profile/settings"),
  updateSettings: (payload: Partial<AppSettings>) =>
    http.patch<AppSettings>("/profile/settings", payload),
  languages: () => http.get<string[]>("/profile/languages"),
  deleteAccount: () => http.delete<{ deleted: boolean }>("/profile"),
};
