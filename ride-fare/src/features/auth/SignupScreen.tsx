import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Lock, Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { authApi } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

export function SignupScreen() {
  const navigate = useNavigate();
  const setPendingPhone = useAuthStore((s) => s.setPendingVerificationPhone);
  const [form, setForm] = useState({
    fullName: "Aarav Mehta",
    email: "aarav@ridex.app",
    phone: "9845021188",
    password: "ridex1234",
    role:"customer"
  });

  const register = useMutation({
    mutationFn: () => authApi.register(form),
    onSuccess: (result) => {
      setPendingPhone(result.phone);
      toast.success("We sent a 6-digit code to your phone");
      void navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message || "Could not create your account"),
  });

  const fields = [
    { key: "fullName" as const, icon: User, placeholder: "Full name", type: "text" },
    { key: "email" as const, icon: Mail, placeholder: "Email address", type: "email" },
    { key: "phone" as const, icon: Phone, placeholder: "Phone number", type: "tel" },
    { key: "password" as const, icon: Lock, placeholder: "Password", type: "password" },
    
  ];

  return (
    <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12">
      <p className="font-display text-xs font-bold tracking-[0.3em] text-primary uppercase">RideX</p>
      <h1 className="font-display mt-3 text-3xl font-bold text-foreground">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A few details and you&apos;re ready to ride.
      </p>

      <form
        className="mt-8 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          register.mutate();
        }}
      >
        {fields.map((field) => (
          <label
            key={field.key}
            className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-elevated px-4 focus-within:border-primary/50"
          >
            <field.icon className="h-4.5 w-4.5 text-muted-foreground" />
            <input
              type={field.type}
              required
              value={form[field.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
              className="flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
            />
          </label>
        ))}

        <button
          type="submit"
          disabled={register.isPending}
          className="glow-primary mt-4 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-60"
        >
          {register.isPending ? "Creating account…" : "Continue"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary">
          Sign in
        </Link>
      </p>
    </div>
  );
}
