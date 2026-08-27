import { api } from "../../lib/axios";

export interface DriverLocationRequest {
  latitude: number;
  longitude: number;
  driverId:number | string;
}

export const updateDriverLocation = async (
  payload: DriverLocationRequest,
) => {
  const { data } = await api.patch(
    "/api/driver/location",
    payload,
  );

  return data;
};


export const getActiveDriverRide = async (
  driverId: number,
) => {
  const { data } = await api.get(
    `/api/rides/driver/${driverId}/active`,
  );

  return data;
};