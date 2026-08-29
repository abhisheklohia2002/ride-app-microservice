import { useQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { CreateRideRequest } from '../dto';
import { acceptRide, cancelRide, completeRide, createRide, getActivePassengerRide } from './../api';



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
    queryFn: async () => {
      try {
        return await getActivePassengerRide(
          passengerId!,
        );
      } catch (error: any) {
        if (
          error?.response?.status === 404
        ) {
          return null;
        }

        throw error;
      }
    },
    enabled: !!passengerId,
    retry: false,
  });
};


export const useCompleteRide = () => {
  return useMutation({
    mutationFn: (rideId: number) =>
      completeRide(rideId),
  });
};