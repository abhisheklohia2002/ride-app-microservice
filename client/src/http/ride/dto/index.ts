export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export type VehicleType =
  | "BIKE"
  | "CAR"
  | "PREMIUM";

export interface CreateRideRequest {
  pickup: Location;
  destination: Location;
  vehicle_type: VehicleType;
}

export interface Ride {
  id: number;
  passenger_id: number;
  driver_id?: number;
  status: string;
  pickup: Location;
  destination: Location;
}

export interface RideResponse {
  ride: Ride;
}