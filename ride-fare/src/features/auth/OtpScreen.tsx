import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { authApi } from "@/api/auth.api";
import { AppHeader } from "@/components/common/AppHeader";
import { useAuthStore } from "@/store/auth.store";
import { maskPhone } from "@/utils/format";

const LENGTH = 6;

export function OtpScreen() {
  const navigate = useNavigate();
  const phone = useAuthStore((s) => s.pendingVerificationPhone);
  const setSession = useAuthStore((s) => s.setSession);
  const setPendingPhone = useAuthStore((s) => s.setPendingVerificationPhone);
  const [digits, setDigits] = useState<string[]>(Array.from({ length: LENGTH }, () => ""));
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const code = digits.join("");

  const verify = useMutation({
    mutationFn: () => authApi.verifyOtp({ code }),
    onSuccess: (session) => {
      setSession(session);
      setPendingPhone(null);
      toast.success("Phone verified");
      void navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error(error.message || "That code didn't work"),
  });

  const resend = useMutation({
    mutationFn: () => authApi.resendOtp(),
    onSuccess: () => {
      setSeconds(30);
      toast.success("New code sent");
    },
  });

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)));
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      clean.split("").forEach((char, offset) => {
        if (index + offset < LENGTH) next[index + offset] = char;
      });
      return next;
    });
    const target = Math.min(LENGTH - 1, index + clean.length);
    inputs.current[target]?.focus();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Verify your number" />
      <div className="px-6 pt-8">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to {phone ? maskPhone(phone) : "your phone"}. Any 6 digits work
          in this demo.
        </p>

        <div className="mt-7 flex gap-2.5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              value={digit}
              inputMode="numeric"
              maxLength={LENGTH}
              onChange={(e) => setDigit(index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digit && index > 0) inputs.current[index - 1]?.focus();
              }}
              className="tabular h-15 flex-1 rounded-2xl border border-border bg-elevated text-center text-xl font-bold text-foreground outline-none focus:border-primary"
            />
          ))}
        </div>

        <button
          type="button"
          disabled={code.length < LENGTH || verify.isPending}
          onClick={() => verify.mutate()}
          className="glow-primary mt-7 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99] disabled:opacity-50"
        >
          {verify.isPending ? "Verifying…" : "Verify & continue"}
        </button>

        <button
          type="button"
          disabled={seconds > 0 || resend.isPending}
          onClick={() => resend.mutate()}
          className="mt-5 w-full text-center text-sm font-semibold text-primary disabled:text-muted-foreground"
        >
          {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
        </button>
      </div>
    </div>
  );
}
