import { api } from "../../lib/axios"; 
import type { CreateRideRequest } from "./dto";



export const createRide = async (
  payload: CreateRideRequest,
) => {
  const { data } = await api.post(
    "/api/rides",
    payload,
  );

  return data;
};



export const acceptRide = async (
  rideId: number,
  driverId: number,
) => {
  const { data } = await api.post(
    `/api/rides/${rideId}/accept`,
    {
      driverId,
    },
  );

  return data;
};

export const cancelRide = async (
  rideId: number,
  cancelledBy: "PASSENGER" | "DRIVER",
  driverId?: number,
) => {
  const { data } = await api.post(
    `/api/rides/${rideId}/cancel`,
    {
      cancelledBy,
      ...(driverId ? { driverId } : {}),
    },
  );

  return data;
};


export const getActivePassengerRide = async (
  passengerId: number,
) => {
  const { data } = await api.get(
    `/api/rides/passenger/${passengerId}/active`,
  );

  return data;
};


