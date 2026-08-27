import { getActiveDriverRide, updateDriverLocation } from './../api';
import { useMutation, useQuery } from "@tanstack/react-query";



export const useUpdateDriverLocation = () => {
  return useMutation({
    mutationFn: updateDriverLocation,
  });
};


export const useActiveDriverRide = (
  driverId?: number,
) => {
  return useQuery({
    queryKey: [
      "active-driver-ride",
      driverId,
    ],
    queryFn: () =>
      getActiveDriverRide(driverId!),
    enabled: !!driverId,
  });
};