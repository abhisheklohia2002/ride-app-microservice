import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  User,
  CarFront,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

import { useAuthStore } from "../stores/auth/auth.store";
import {
  useLogin,
  useRegister,
} from "../http/auth/hooks/use-auth";

type AuthMode = "login" | "register";

type RegisterForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "PASSENGER" | "DRIVER";
};

export default function AuthForm() {
  const navigate = useNavigate();

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] =
    useState<RegisterForm>({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "PASSENGER",
    });

  const isLogin = mode === "login";

  const updateLoginField = (
    field: keyof typeof loginForm,
    value: string,
  ) => {
    setLoginForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateRegisterField = (
    field: keyof RegisterForm,
    value: string,
  ) => {
    setRegisterForm((prev) => ({
      ...prev,
      [field]:
        field === "role"
          ? (value as RegisterForm["role"])
          : value,
    }));
  };

  const handleSubmit = (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (isLogin) {
      console.log('login')
      loginMutation.mutate(
        loginForm,
        {
          onSuccess: (response: any) => {
            setUser(response);

            navigate(
              response.role === "DRIVER"
                ? "/driver"
                : "/passenger",
            );
          },
        },
      );

      return;
    }
      console.log('register')

    registerMutation.mutate(
      registerForm,
      {
        onSuccess: (response:any) => {
          setUser(response);

          navigate(
            response?.role === "DRIVER"
              ? "/driver"
              : "/passenger",
          );
        },
      },
    );
  };

  const isPending =
    loginMutation.isPending ||
    registerMutation.isPending;

  return (
    <motion.form
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.35,
      }}
      onSubmit={handleSubmit}
      className="
        w-full
        max-w-[500px]
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-7
        shadow-[0_20px_60px_rgba(15,23,42,0.08)]
      "
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[30px] font-bold tracking-tight text-slate-950">
          {isLogin
            ? "Welcome back"
            : "Create your account"}
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          {isLogin
            ? "Sign in to continue your journey with Ride."
            : "Join Ride and start your journey today."}
        </p>
      </div>

      {/* Auth Switch */}
      <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setShowPassword(false);
          }}
          className={`
            flex-1
            rounded-lg
            px-4
            py-2.5
            text-sm
            font-medium
            transition-all
            ${
              isLogin
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }
          `}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("register");
            setShowPassword(false);
          }}
          className={`
            flex-1
            rounded-lg
            px-4
            py-2.5
            text-sm
            font-medium
            transition-all
            ${
              !isLogin
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }
          `}
        >
          Create account
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isLogin ? (
          <motion.div
            key="register"
            initial={{
              opacity: 0,
              x: 8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -8,
            }}
            transition={{
              duration: 0.2,
            }}
            className="space-y-4"
          >
            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Full name"
                placeholder="John Doe"
                icon={<User size={17} />}
                value={registerForm.fullName}
                onChange={(value) =>
                  updateRegisterField(
                    "fullName",
                    value,
                  )
                }
              />

              <InputField
                label="Phone"
                placeholder="+91 98765..."
                icon={<Phone size={17} />}
                value={registerForm.phone}
                onChange={(value) =>
                  updateRegisterField(
                    "phone",
                    value,
                  )
                }
              />
            </div>

            {/* Email */}
            <InputField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={17} />}
              value={registerForm.email}
              onChange={(value) =>
                updateRegisterField(
                  "email",
                  value,
                )
              }
            />

            {/* Password */}
            <PasswordField
              value={registerForm.password}
              showPassword={showPassword}
              onToggle={() =>
                setShowPassword(
                  (prev) => !prev,
                )
              }
              onChange={(value) =>
                updateRegisterField(
                  "password",
                  value,
                )
              }
            />

            {/* Role */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                How do you want to use Ride?
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Passenger */}
                <button
                  type="button"
                  onClick={() =>
                    updateRegisterField(
                      "role",
                      "PASSENGER",
                    )
                  }
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    p-3
                    text-left
                    transition-all
                    ${
                      registerForm.role ===
                      "PASSENGER"
                        ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-300"
                    }
                  `}
                >
                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${
                        registerForm.role ===
                        "PASSENGER"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    <User size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Passenger
                    </p>

                    <p className="text-xs text-slate-500">
                      Book rides
                    </p>
                  </div>
                </button>

                {/* Driver */}
                <button
                  type="button"
                  onClick={() =>
                    updateRegisterField(
                      "role",
                      "DRIVER",
                    )
                  }
                  className={`
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    p-3
                    text-left
                    transition-all
                    ${
                      registerForm.role ===
                      "DRIVER"
                        ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900"
                        : "border-slate-200 hover:border-slate-300"
                    }
                  `}
                >
                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${
                        registerForm.role ===
                        "DRIVER"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-500"
                      }
                    `}
                  >
                    <CarFront size={17} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Driver
                    </p>

                    <p className="text-xs text-slate-500">
                      Earn with Ride
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{
              opacity: 0,
              x: 8,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -8,
            }}
            transition={{
              duration: 0.2,
            }}
            className="space-y-4"
          >
            {/* Email */}
            <InputField
              label="Email address"
              type="email"
              placeholder="you@example.com"
              icon={<Mail size={17} />}
              value={loginForm.email}
              onChange={(value) =>
                updateLoginField(
                  "email",
                  value,
                )
              }
            />

            {/* Password */}
            <PasswordField
              value={loginForm.password}
              showPassword={showPassword}
              onToggle={() =>
                setShowPassword(
                  (prev) => !prev,
                )
              }
              onChange={(value) =>
                updateLoginField(
                  "password",
                  value,
                )
              }
            />

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-slate-600 hover:text-slate-950"
              >
                Forgot password?
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {(loginMutation.isError ||
        registerMutation.isError) && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          {isLogin
            ? "Login failed. Please check your credentials."
            : "Registration failed. Please try again."}
        </p>
      )}

      {/* Submit */}
      <motion.button
        whileHover={{
          y: -1,
        }}
        whileTap={{
          scale: 0.98,
        }}
        type="submit"
        disabled={isPending}
        className="
          mt-5
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-slate-950
          px-4
          py-3.5
          text-sm
          font-semibold
          text-white
          shadow-lg
          shadow-slate-950/10
          transition
          hover:bg-slate-800
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {isPending
          ? isLogin
            ? "Signing in..."
            : "Creating account..."
          : isLogin
            ? "Sign in"
            : "Create account"}

        {!isPending && (
          <ArrowRight size={17} />
        )}
      </motion.button>

      {/* Bottom */}
      <p className="mt-5 text-center text-sm text-slate-500">
        {isLogin
          ? "Don't have an account?"
          : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() =>
            setMode(
              isLogin
                ? "register"
                : "login",
            )
          }
          className="font-semibold text-slate-950 hover:underline"
        >
          {isLogin
            ? "Create one"
            : "Sign in"}
        </button>
      </p>
    </motion.form>
  );
}

/* -------------------------------- */
/* Input Component                  */
/* -------------------------------- */

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  type?: string;
  icon: React.ReactNode;
  onChange: (value: string) => void;
};

function InputField({
  label,
  placeholder,
  value,
  type = "text",
  icon,
  onChange,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder={placeholder}
          required
          className="
            h-12
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            pl-10
            pr-3
            text-sm
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-slate-900
            focus:ring-2
            focus:ring-slate-900/5
          "
        />
      </div>
    </div>
  );
}

/* -------------------------------- */
/* Password Component               */
/* -------------------------------- */

type PasswordFieldProps = {
  value: string;
  showPassword: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
};

function PasswordField({
  value,
  showPassword,
  onToggle,
  onChange,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Password
      </label>

      <div className="relative">
        <Lock
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          placeholder="Enter your password"
          required
          className="
            h-12
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            pl-10
            pr-11
            text-sm
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-slate-900
            focus:ring-2
            focus:ring-slate-900/5
          "
        />

        <button
          type="button"
          onClick={onToggle}
          className="
            absolute
            right-3
            top-1/2
            -translate-y-1/2
            text-slate-400
            transition
            hover:text-slate-700
          "
        >
          {showPassword ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}