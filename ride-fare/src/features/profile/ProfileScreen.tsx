import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, Star } from "lucide-react";
import { toast } from "sonner";

import { authApi } from "@/api/auth.api";
import { profileApi } from "@/api/profile.api";
import { queryKeys } from "@/api/query-keys";
import { BottomNav } from "@/components/common/BottomNav";
import { Loader } from "@/components/common/Loader";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/auth.store";
import type { AppSettings } from "@/types";

const SETTING_LABELS: Array<{ key: keyof AppSettings; label: string; hint: string }> = [
  { key: "pushNotifications", label: "Push notifications", hint: "Offers and account alerts" },
  { key: "rideUpdates", label: "Ride updates", hint: "Captain arrival and trip status" },
  { key: "promotions", label: "Promotions", hint: "Discounts and referral news" },
  { key: "shareTripData", label: "Share trip data", hint: "Live location with emergency contact" },
  { key: "biometricLock", label: "Biometric lock", hint: "Require Face ID to open RideX" },
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  const profileQuery = useQuery({ queryKey: queryKeys.profile.detail, queryFn: profileApi.get });
  const settingsQuery = useQuery({
    queryKey: queryKeys.profile.settings,
    queryFn: profileApi.settings,
  });

  const updateSettings = useMutation({
    mutationFn: (payload: Partial<AppSettings>) => profileApi.updateSettings(payload),
    onSuccess: (settings) => queryClient.setQueryData(queryKeys.profile.settings, settings),
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      clearSession();
      toast.success("Signed out");
      void navigate({ to: "/login" });
    },
  });

  const user = profileQuery.data;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b border-border bg-background/85 px-5 pb-3 backdrop-blur-xl">
        <h1 className="font-display text-xl font-bold text-foreground">Profile</h1>
      </header>

      <div className="flex-1 space-y-4 px-5 py-5">
        {profileQuery.isPending || !user ? (
          <Loader className="py-10" />
        ) : (
          <div className="flex items-center gap-4 rounded-3xl border border-border bg-elevated p-4">
            <UserAvatar name={user.fullName} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold text-foreground">{user.fullName}</p>
              <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
              <p className="mt-1 flex items-center gap-1 text-[13px] text-muted-foreground">
                <Star className="h-3 w-3 fill-primary text-primary" /> {user.rating} rating
              </p>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-border bg-elevated p-2">
          {settingsQuery.data
            ? SETTING_LABELS.map((item) => (
                <div key={item.key} className="flex items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium text-foreground">{item.label}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{item.hint}</p>
                  </div>
                  <Switch
                    checked={settingsQuery.data[item.key]}
                    onCheckedChange={(checked) => updateSettings.mutate({ [item.key]: checked })}
                  />
                </div>
              ))
            : <Loader className="py-6" />}
        </div>

        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[15px] font-semibold text-destructive active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
