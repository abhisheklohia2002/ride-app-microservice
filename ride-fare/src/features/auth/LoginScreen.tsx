import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

export function LoginScreen() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("aarav@ridex.app");
  const [password, setPassword] = useState("ridex1234");

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (session) => {
      setSession(session);
      toast.success(`Welcome back, ${session.user.fullName.split(" ")[0]}`);
      void navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message || "Could not sign you in"),
  });

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12">
      <p className="font-display text-xs font-bold tracking-[0.3em] text-primary uppercase">RideX</p>
      <h1 className="font-display mt-3 text-3xl font-bold text-foreground">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to book rides, track captains and view your trips.
      </p>

      <form
        className="mt-8 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate();
        }}
      >
        <label className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-elevated px-4 focus-within:border-primary/50">
          <Mail className="h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </label>
        <label className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-elevated px-4 focus-within:border-primary/50">
          <Lock className="h-4.5 w-4.5 text-muted-foreground" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </label>

        <button
          type="submit"
          disabled={login.isPending}
          className="glow-primary mt-4 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-60"
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to RideX?{" "}
        <Link to="/signup" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
      <Link to="/" className="mt-3 text-center text-xs text-muted-foreground underline">
        Continue as guest
      </Link>
    </div>
  );
}
