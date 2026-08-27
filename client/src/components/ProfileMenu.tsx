import { useState } from "react";
import { LogOut, User, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth/auth.store";
import { useLogout } from "../http/auth/hooks/use-auth";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const clearUser = useAuthStore((state) => state.clearUser);

  const navigate = useNavigate();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        clearUser();

        navigate("/login", {
          replace: true,
        });
      },
      onError: (error) => {
        console.error("Logout failed:", error);
      },
    });
  };
  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <User size={17} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-12 z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-start justify-between border-b border-slate-100 px-4 py-4">
            <div className="min-w-0 space-y-2">
              <div>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.fullName}
                </p>

                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>

              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-slate-600">
                {user.role}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-3 shrink-0 text-slate-400 transition hover:text-slate-700"
            >
              <X size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
