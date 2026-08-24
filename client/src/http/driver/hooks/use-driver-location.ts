import {
  useEffect,
  useRef,
} from "react";

import {
  useUpdateDriverLocation,
} from "./use-driver";

export interface DriverLocation {
  latitude: number;
  longitude: number;
}

interface Props {
  enabled: boolean;

  onLocationChange?: (
    location: DriverLocation,
  ) => void;
}

export const useDriverLocation = ({
  enabled,
  onLocationChange,
}: Props) => {
  const watchId =
    useRef<number | null>(null);

  const updateLocation =
    useUpdateDriverLocation();

  const onLocationChangeRef =
    useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current =
      onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!enabled) {
      if (
        watchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current,
        );

        watchId.current = null;
      }

      return;
    }

    if (!navigator.geolocation) {
      console.error(
        "Geolocation is not supported",
      );

      return;
    }

    watchId.current =
      navigator.geolocation.watchPosition(
        (position) => {
          const {
            latitude,
            longitude,
          } = position.coords;

          const location = {
            latitude,
            longitude,
          };

          console.log(
            "Driver location:",
            location,
          );

          // Send location to backend
          updateLocation.mutate({
            latitude,
            longitude,
          });

          // Update frontend map
          onLocationChangeRef.current?.(
            location,
          );
        },

        (error) => {
          console.error(
            "Driver location error:",
            error,
          );
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        },
      );

    return () => {
      if (
        watchId.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchId.current,
        );

        watchId.current = null;
      }
    };
  }, [
    enabled,
    updateLocation,
  ]);
};