import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth/auth.store";
import { useLogin } from "../http/auth/hooks/use-auth";



export default function LoginForm() {
  const navigate = useNavigate();

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const handleSubmit = (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    loginMutation.mutate(
      {
        email,
        password,
      },
      {
        onSuccess: (response:any) => {
             console.log("LOGIN RESPONSE:", response);
              setUser(response);
          if (
            response.role ===
            "DRIVER"
          ) {
            navigate("/driver");
          } else {
            navigate("/passenger");
          }
        },
      },
    );
  };

  return (
    <motion.form
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
    >
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back
        </h1>

        <p className="mt-2 text-slate-500">
          Sign in to your Ride account
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Email
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          placeholder="••••••••"
          required
        />
      </div>

      {loginMutation.isError && (
        <p className="text-sm text-red-500">
          Login failed. Please check your
          credentials.
        </p>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loginMutation.isPending
          ? "Signing in..."
          : "Login"}
      </motion.button>
    </motion.form>
  );
}