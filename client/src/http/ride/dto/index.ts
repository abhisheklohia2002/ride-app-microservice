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
  passengerID:number | string;
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




export type MapLocation = {
  latitude: number;
  longitude: number;
};

export type GeocodingResult = {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type RouteResult = {
  distance: number;
  duration: number;

  geometry: {
    type: "LineString";
    coordinates: [
      number,
      number,
    ][];
  };
};