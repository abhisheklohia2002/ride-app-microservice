import { Navigate, Outlet } from "react-router-dom";
import { Alert } from "antd";
import { useAuthStore } from "../stores/auth/auth.store";
import type { UserRole } from "../stores/auth/auth.store";


interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export  function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {

  
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated,
  );
  console.log(user)
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <Alert
          type="warning"
          showIcon
          message="Access denied"
          description={`Your ${user.role} role does not have access to this module.`}
        />
      </div>
    );
  }

  return <Outlet />;
}