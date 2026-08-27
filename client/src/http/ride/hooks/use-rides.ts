import type { CreateRideRequest } from '../dto';
import { acceptRide, cancelRide, createRide, getActivePassengerRide } from './../api';
import { useMutation, useQuery } from "@tanstack/react-query";



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
      driverId,
    }: {
      rideId: number;
      cancelledBy: "PASSENGER" | "DRIVER";
      driverId?: number;
    }) => cancelRide(rideId, cancelledBy, driverId),
  });
};



export const useActivePassengerRide = (
  passengerId?: number,
) => {
  return useQuery({
    queryKey: [
      "active-passenger-ride",
      passengerId,
    ],
    queryFn: () =>
      getActivePassengerRide(passengerId!),
    enabled: !!passengerId,
  });
};