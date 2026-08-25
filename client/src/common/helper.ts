let socket: WebSocket | null = null;

export const connectDriverSocket = (
  driverId: number,
  onMessage: (message: any) => void,
) => {
  socket = new WebSocket(
    `ws://localhost:8081/ws/driver?driverId=${driverId}`,
  );

  socket.onopen = () => {
    console.log("Driver WebSocket connected");
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);

    console.log("Driver event:", message);

    onMessage(message);
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