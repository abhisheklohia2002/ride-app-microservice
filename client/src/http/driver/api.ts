import { api } from "../../lib/axios";

export interface DriverLocationRequest {
  latitude: number;
  longitude: number;
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