let socket: WebSocket | null = null;

export const connectPassengerSocket = (
  passengerId: number,
  onMessage: (message: any) => void,
) => {
  socket = new WebSocket(
    `ws://localhost:8085/ws/passenger?passengerId=${passengerId}`,
  );

  socket.onopen = () => {
    console.log(
      "Passenger WebSocket connected",
    );
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(
        event.data,
      );

      console.log(
        "Passenger event:",
        message,
      );

      onMessage(message);
    } catch (error) {
      console.error(
        "Invalid passenger WebSocket message",
        error,
      );
    }
  };

  socket.onerror = (error) => {
    console.error(
      "Passenger WebSocket error:",
      error,
    );
  };

  socket.onclose = () => {
    console.log(
      "Passenger WebSocket disconnected",
    );
  };
};

export const disconnectPassengerSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};