import { useNavigate } from "react-router-dom";
import AuthForm from "../../components/LoginForm";
import { useAuthStore } from "../../stores/auth/auth.store";
import { useEffect } from "react";



export default function LoginPage() {
    const user = useAuthStore(
    (state) => state.user,
  );

  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (user.role === "PASSENGER") {
      navigate("/passenger", {
        replace: true,
      });
      return;
    }

    if (user.role === "DRIVER") {
      navigate("/driver", {
        replace: true,
      });
    }
  }, [
    isAuthenticated,
    user,
    navigate,
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <AuthForm  />
    </main>
  );
}