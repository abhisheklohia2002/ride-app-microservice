import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth/auth.store";
import { useRegister } from "../http/auth/hooks/use-auth";



export default function RegisterForm() {
  const navigate = useNavigate();

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const registerMutation =
    useRegister();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "PASSENGER" as
      | "PASSENGER"
      | "DRIVER",
  });

  const updateField = (
    field: string,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    registerMutation.mutate(form, {
      onSuccess: (response) => {
        setUser(response.data);

        navigate(
          response.data.role === "DRIVER"
            ? "/driver"
            : "/passenger",
        );
      },
    });
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
      className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
    >
      <div>
        <h1 className="text-3xl font-bold">
          Create account
        </h1>

        <p className="mt-2 text-slate-500">
          Start using Ride today
        </p>
      </div>

      <input
        placeholder="Full name"
        value={form.fullName}
        onChange={(e) =>
          updateField(
            "fullName",
            e.target.value,
          )
        }
        className="w-full rounded-xl border px-4 py-3"
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          updateField(
            "email",
            e.target.value,
          )
        }
        className="w-full rounded-xl border px-4 py-3"
        required
      />

      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) =>
          updateField(
            "phone",
            e.target.value,
          )
        }
        className="w-full rounded-xl border px-4 py-3"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) =>
          updateField(
            "password",
            e.target.value,
          )
        }
        className="w-full rounded-xl border px-4 py-3"
        required
      />

      <select
        value={form.role}
        onChange={(e) =>
          updateField(
            "role",
            e.target.value,
          )
        }
        className="w-full rounded-xl border px-4 py-3"
      >
        <option value="PASSENGER">
          Passenger
        </option>

        <option value="DRIVER">
          Driver
        </option>
      </select>

      <motion.button
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={
          registerMutation.isPending
        }
        className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {registerMutation.isPending
          ? "Creating..."
          : "Create account"}
      </motion.button>
    </motion.form>
  );
}