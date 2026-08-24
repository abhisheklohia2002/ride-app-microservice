import { updateDriverLocation } from './../api';
import { useMutation } from "@tanstack/react-query";



export const useUpdateDriverLocation = () => {
  return useMutation({
    mutationFn: updateDriverLocation,
  });
};