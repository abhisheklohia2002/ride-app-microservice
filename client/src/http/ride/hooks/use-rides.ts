import type { CreateRideRequest } from '../dto';
import { acceptRide, cancelRide, createRide } from './../api';
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




export const useCancelRide = () => {
  return useMutation({
    mutationFn: ({
      rideId,
      cancelledBy,
    }: {
      rideId: number;
      cancelledBy: "PASSENGER" | "DRIVER";
    }) => cancelRide(rideId, cancelledBy),
  });
};