package websocket

import (
	"net/http"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu      sync.RWMutex
	drivers map[uint64]*websocket.Conn
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func NewHub() *Hub {
	return &Hub{
		drivers: make(map[uint64]*websocket.Conn),
	}
}

func (h *Hub) Register(
	driverID uint64,
	conn *websocket.Conn,
) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if oldConn, exists := h.drivers[driverID]; exists {
		_ = oldConn.Close()
	}

	h.drivers[driverID] = conn
}

func (h *Hub) Remove(
	driverID uint64,
	conn *websocket.Conn,
) {
	h.mu.Lock()
	defer h.mu.Unlock()

	current, exists := h.drivers[driverID]

	if !exists {
		return
	}

	if current == conn {
		delete(h.drivers, driverID)
	}
}

func (h *Hub) SendToDriver(
	driverID uint64,
	message any,
) error {
	h.mu.RLock()

	conn, exists := h.drivers[driverID]

	h.mu.RUnlock()

	if !exists {
		return nil
	}

	return conn.WriteJSON(message)
}

func DriverWebSocket(
	hub *Hub,
) http.HandlerFunc {
	return func(
		w http.ResponseWriter,
		r *http.Request,
	) {
		driverIDValue :=
			r.URL.Query().Get("driverId")

		driverID, err :=
			strconv.ParseUint(
				driverIDValue,
				10,
				64,
			)

		if err != nil {
			http.Error(
				w,
				"invalid driver id",
				http.StatusBadRequest,
			)
			return
		}

		conn, err :=
			upgrader.Upgrade(
				w,
				r,
				nil,
			)

		if err != nil {
			return
		}

		hub.Register(
			driverID,
			conn,
		)

		defer func() {
			hub.Remove(
				driverID,
				conn,
			)

			_ = conn.Close()
		}()

		for {
			if _, _, err :=
				conn.ReadMessage(); err != nil {
				return
			}
		}
	}
}
