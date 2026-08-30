package websocket

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {
	mu         sync.RWMutex
	writeMu    sync.Mutex
	passengers map[uint64]*websocket.Conn
	drivers    map[uint64]*websocket.Conn
}

func NewHub() *Hub {
	return &Hub{
		passengers: make(map[uint64]*websocket.Conn),
		drivers:    make(map[uint64]*websocket.Conn),
	}
}

func (h *Hub) Register(
	passengerID uint64,
	conn *websocket.Conn,
) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if old, exists := h.passengers[passengerID]; exists {
		_ = old.Close()
	}

	h.passengers[passengerID] = conn
}

func (h *Hub) Remove(
	passengerID uint64,
	conn *websocket.Conn,
) {
	h.mu.Lock()
	defer h.mu.Unlock()

	current, exists := h.passengers[passengerID]

	if !exists {
		return
	}

	if current == conn {
		delete(h.passengers, passengerID)
	}
}

func (h *Hub) SendToPassenger(
	passengerID uint64,
	message any,
) error {
	h.mu.RLock()

	conn, exists := h.passengers[passengerID]

	h.mu.RUnlock()

	if !exists {
		return nil
	}

	h.writeMu.Lock()
	defer h.writeMu.Unlock()

	return conn.WriteJSON(message)
}

func (h *Hub) SendToDriver(
	driverID uint64,
	payload any,
) error {
	h.mu.RLock()

	conn, ok := h.drivers[driverID]

	h.mu.RUnlock()

	if !ok {
		return fmt.Errorf(
			"driver websocket not connected: %d",
			driverID,
		)
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	return conn.WriteMessage(
		websocket.TextMessage,
		body,
	)
}
