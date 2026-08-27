import type { DriverSocketMessage } from "../http/driver/hooks/driver-socket";

let socket: WebSocket | null = null;

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
      const message = JSON.parse(event.data) as DriverSocketMessage;

      console.log("Driver event:", message);

      onMessage(message);
    } catch (error) {
      console.error("Invalid driver WebSocket message:", error);
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
