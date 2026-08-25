import {
  Navigation,
  Phone,
  MapPin,
  Car,
} from "lucide-react";

interface ActiveRide {
  id: number;
  driverId: number;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  status: string;
}

interface Props {
  ride: ActiveRide;
}

export default function DriverActiveRidePage({
  ride,
}: Props) {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-slate-100">
      <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
        <div className="text-center">
          <MapPin
            size={42}
            className="mx-auto text-emerald-500"
          />

          <p className="mt-2 text-sm text-slate-500">
            Active ride map
          </p>
        </div>
      </div>

      <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
        <div className="rounded-2xl bg-white px-4 py-3 shadow-xl">
          <p className="text-xs text-slate-400">
            Ride
          </p>

          <p className="font-bold">
            #{ride.id}
          </p>
        </div>

        <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
          {ride.status}
        </div>
      </div>

      <section className="absolute bottom-0 left-0 right-0 z-20 rounded-t-[30px] bg-white p-5 shadow-2xl md:bottom-5 md:left-5 md:right-auto md:w-[440px] md:rounded-[30px]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <Car size={20} />
          </div>

          <div>
            <p className="text-xs text-slate-400">
              Active Ride
            </p>

            <h1 className="text-xl font-bold text-slate-950">
              Ride #{ride.id}
            </h1>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              PICKUP
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {ride.pickupLatitude},{" "}
              {ride.pickupLongitude}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs text-slate-400">
              DESTINATION
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {ride.dropoffLatitude},{" "}
              {ride.dropoffLongitude}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 font-semibold text-slate-700"
          >
            <Phone size={16} />
            Call
          </button>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 font-semibold text-white"
          >
            <Navigation size={16} />
            Navigate
          </button>
        </div>
      </section>
    </main>
  );
}