import type { CreateRideRequest } from '../dto';
import { createRide } from './../api';
import { useMutation } from "@tanstack/react-query";



export const useCreateRide = () => {
  return useMutation({
    mutationFn: (payload: CreateRideRequest) =>
      createRide(payload),
  });
};