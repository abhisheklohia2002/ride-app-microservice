import type { CreateRideRequest } from '../dto';
import { acceptRide, createRide } from './../api';
import { useMutation } from "@tanstack/react-query";



export const useCreateRide = () => {
  return useMutation({
    mutationFn: (payload: CreateRideRequest) =>
      createRide(payload),
  });
};


export const useAcceptRide = () => {
  return useMutation({
    mutationFn: ({
      rideId,
      driverId,
    }: {
      rideId: number;
      driverId: number;
    }) => acceptRide(rideId, driverId),
  });
};