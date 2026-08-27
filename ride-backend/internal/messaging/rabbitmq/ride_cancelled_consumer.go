package rabbitmq

import (
	"context"
	"encoding/json"
	"log"

	"github.com/rabbitmq/amqp091-go"
	"github.com/ride-app/ride-driver-service/internal/common/websocket"
)

type RideCancelledEvent struct {
	RideID      int64   `json:"ride_id"`
	PassengerID uint64  `json:"passenger_id"`
	DriverID    *uint64 `json:"driver_id,omitempty"`
	CancelledBy string  `json:"cancelled_by"`
}

type RideCancelledConsumer struct {
	rabbitConsumer *Consumer
	hub            *websocket.Hub
}

func NewRideCancelledConsumer(consumer *Consumer, hub *websocket.Hub) *RideCancelledConsumer {
	return &RideCancelledConsumer{rabbitConsumer: consumer, hub: hub}
}

func (c *RideCancelledConsumer) Start(ctx context.Context) error {
	messages, err := c.rabbitConsumer.Consume("driver.ride.cancellations", "RIDE_CANCELLED_DRIVER")
	if err != nil {
		return err
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case message, ok := <-messages:
				if !ok {
					return
				}
				if err := c.handleMessage(message); err != nil {
					log.Printf("failed to process ride cancellation: %v", err)
					_ = message.Nack(false, true)
					continue
				}
				if err := message.Ack(false); err != nil {
					log.Printf("failed to acknowledge ride cancellation: %v", err)
				}
			}
		}
	}()

	return nil
}

func (c *RideCancelledConsumer) handleMessage(message amqp091.Delivery) error {
	var event RideCancelledEvent
	if err := json.Unmarshal(message.Body, &event); err != nil {
		return err
	}
	if event.DriverID == nil {
		return nil
	}

	return c.hub.SendToDriver(*event.DriverID, map[string]any{
		"type": "RIDE_CANCELLED",
		"data": event,
	})
}
