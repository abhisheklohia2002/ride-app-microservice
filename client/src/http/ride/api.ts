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
) => {
  const { data } = await api.post(
    `/api/rides/${rideId}/cancel`,
    {
      cancelledBy,
    },
  );

  return data;
};