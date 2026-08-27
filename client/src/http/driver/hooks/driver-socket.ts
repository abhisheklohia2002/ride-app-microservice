let socket: WebSocket | null = null;

export interface RideRequest {
  ride_id: number;
  passenger_id: number;
  driver_id: number;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_latitude: number;
  dropoff_longitude: number;
  vehicle_type: string;
}

export interface DriverSocketMessage {
  type: string;
  data: RideRequest | RideCancelledEvent;
}

export interface RideCancelledEvent {
  ride_id: number;
  passenger_id: number;
  driver_id?: number;
  cancelled_by: "PASSENGER" | "DRIVER";
}

export const connectDriverSocket = (
  driverId: number,
  onMessage: (message: DriverSocketMessage) => void,
) => {
  socket = new WebSocket(
    `ws://localhost:8081/ws/driver?driverId=${driverId}`,
  );

  socket.onopen = () => {
    console.log("Driver WebSocket connected");
  };

  socket.onmessage = (event) => {
    try {
      const message =
        JSON.parse(event.data) as DriverSocketMessage;

      console.log("Driver event:", message);

      onMessage(message);
    } catch (error) {
      console.error(
        "Invalid WebSocket message:",
        error,
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "Driver WebSocket error:",
      error,
    );
  };

  socket.onclose = () => {
    console.log(
      "Driver WebSocket disconnected",
    );
  };
};

export const disconnectDriverSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};
