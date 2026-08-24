import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 lg:grid-cols-2">
        <div className="hidden lg:block">
          <p
            className="text-sm font-semibold uppercase tracking-widest"
            style={{
              color: "#109B9C",
            }}
          >
            RidoXL
          </p>

          <h1 className="mt-4 text-5xl font-bold leading-tight text-slate-900">
            Manage rides. Track your trips. Travel with confidence.
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            A seamless ride platform for booking trips, tracking rides, managing
            drivers, destinations, and your complete travel activity.
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
