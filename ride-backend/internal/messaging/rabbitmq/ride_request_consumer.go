package rabbitmq

import (
	"context"
	"encoding/json"
	"log"

	"github.com/rabbitmq/amqp091-go"

	"github.com/ride-app/ride-driver-service/internal/common/websocket"
	"github.com/ride-app/ride-driver-service/internal/events"
	// "github.com/ride-app/ride-driver-service/internal/events"
)

type RideRequestConsumer struct {
	rabbitConsumer *Consumer
	hub            *websocket.Hub
}

func NewRideRequestConsumer(
	rabbitConsumer *Consumer,
	hub *websocket.Hub,
) *RideRequestConsumer {
	return &RideRequestConsumer{
		rabbitConsumer: rabbitConsumer,
		hub:            hub,
	}
}

type RideRequestedEvent struct {
	RideID           int64   `json:"ride_id"`
	PassengerID      int64   `json:"passenger_id"`
	DriverID         uint64  `json:"driver_id"`
	PickupLatitude   float64 `json:"pickup_latitude"`
	PickupLongitude  float64 `json:"pickup_longitude"`
	DropoffLatitude  float64 `json:"dropoff_latitude"`
	DropoffLongitude float64 `json:"dropoff_longitude"`
	VehicleType      string  `json:"vehicle_type"`
}

func (c *RideRequestConsumer) Start(
	ctx context.Context,
) error {

	log.Println("starting ride request consumer")

	messages, err := c.rabbitConsumer.Consume(
		"driver.ride.requests",
		"RIDE_REQUESTED",
	)

	if err != nil {
		log.Printf(
			"failed to create ride request consumer: %v",
			err,
		)

		return err
	}

	if err := c.rabbitConsumer.Bind(
		"driver.ride.requests",
		"RIDE_TAKEN",
	); err != nil {
		return err
	}
	log.Println(
		"ride request consumer listening queue=driver.ride.requests routingKey=RIDE_REQUESTED",
	)

	go func() {
		for {
			select {
			case <-ctx.Done():
				return

			case message, ok := <-messages:
				if !ok {
					return
				}

				if err := c.handleMessage(
					message,
				); err != nil {

					log.Printf(
						"failed to process ride request: %v",
						err,
					)

					_ = message.Nack(
						false,
						true,
					)

					continue
				}

				if err := message.Ack(false); err != nil {
					log.Printf(
						"failed to acknowledge ride request: %v",
						err,
					)
				}
			}
		}
	}()

	return nil
}

func (c *RideRequestConsumer) handleMessage(
	message amqp091.Delivery,
) error {

	switch message.RoutingKey {

	case "RIDE_REQUESTED":
		return c.handleRideRequested(message)

	case "RIDE_TAKEN":
		return c.handleRideTaken(message)

	default:
		log.Printf(
			"unknown ride event routing key=%s",
			message.RoutingKey,
		)

		return nil
	}
}

func (c *RideRequestConsumer) handleRideRequested(
	message amqp091.Delivery,
) error {

	var event RideRequestedEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	log.Printf(
		"ride request received ride=%d driver=%d",
		event.RideID,
		event.DriverID,
	)

	payload := map[string]any{
		"type": "RIDE_REQUEST",
		"data": event,
	}

	if err := c.hub.SendToDriver(
		event.DriverID,
		payload,
	); err != nil {
		return err
	}

	log.Printf(
		"ride request sent to driver=%d",
		event.DriverID,
	)

	return nil
}
func (c *RideRequestConsumer) handleRideTaken(
	message amqp091.Delivery,
) error {
	var event events.RideTakenEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	payload := map[string]any{
		"type": "RIDE_TAKEN",
		"data": event,
	}

	return c.hub.SendToDriver(
		event.DriverID,
		payload,
	)
}
