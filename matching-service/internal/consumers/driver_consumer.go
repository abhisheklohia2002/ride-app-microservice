package consumers

import (
	"context"
	"encoding/json"
	"log"

	"github.com/rabbitmq/amqp091-go"

	"github.com/ride-app/ride-matching-service/internal/messaging/rabbitmq"
	"github.com/ride-app/ride-matching-service/internal/services"
	matchingWebSocket "github.com/ride-app/ride-matching-service/internal/websocket"
)

type DriverLocationUpdatedEvent struct {
	DriverID  uint64  `json:"driver_id"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type DriverConsumer struct {
	rabbitConsumer  *rabbitmq.Consumer
	matchingService *services.MatchingService
	passengerHub    *matchingWebSocket.Hub
	activeRideStore *services.ActiveRideStore
}

func NewDriverConsumer(
	rabbitConsumer *rabbitmq.Consumer,
	matchingService *services.MatchingService,
	passengerHub *matchingWebSocket.Hub,
	activeRideStore *services.ActiveRideStore,
) *DriverConsumer {
	return &DriverConsumer{
		rabbitConsumer:  rabbitConsumer,
		matchingService: matchingService,
		passengerHub:    passengerHub,
		activeRideStore: activeRideStore,
	}
}

func (c *DriverConsumer) Start(
	ctx context.Context,
) error {
	messages, err := c.rabbitConsumer.Consume(
		"matching.driver.location",
		rabbitmq.DriverExchange,
		"DRIVER_LOCATION_UPDATED",
	)
	if err != nil {
		return err
	}

	log.Println(
		"driver location consumer started",
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
					ctx,
					message,
				); err != nil {
					log.Printf(
						"failed to process driver location: %v",
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
						"failed to acknowledge driver location: %v",
						err,
					)
				}
			}
		}
	}()

	return nil
}

func (c *DriverConsumer) handleMessage(
	ctx context.Context,
	message amqp091.Delivery,
) error {
	var event DriverLocationUpdatedEvent

	if err := json.Unmarshal(
		message.Body,
		&event,
	); err != nil {
		return err
	}

	if event.DriverID == 0 {
		return nil
	}

	if err := c.matchingService.UpdateDriverLocation(
		ctx,
		event.DriverID,
		event.Latitude,
		event.Longitude,
	); err != nil {
		return err
	}

	log.Printf(
		"driver location updated: driver=%d lat=%f lng=%f",
		event.DriverID,
		event.Latitude,
		event.Longitude,
	)

	err := c.matchingService.RetryPendingRides(ctx)
	if err != nil {
		log.Printf(
			"failed to retry pending rides: %v",
			err,
		)
	}

	activeRide, ok :=
		c.activeRideStore.GetByDriver(
			event.DriverID,
		)

	if !ok {
		return nil
	}

	payload := map[string]any{
		"type": "DRIVER_LOCATION_UPDATED",
		"data": map[string]any{
			"ride_id":   activeRide.RideID,
			"driver_id": event.DriverID,
			"latitude":  event.Latitude,
			"longitude": event.Longitude,
		},
	}

	if err := c.passengerHub.SendToPassenger(
		activeRide.PassengerID,
		payload,
	); err != nil {
		return err
	}

	log.Printf(
		"driver location sent to passenger=%d driver=%d",
		activeRide.PassengerID,
		event.DriverID,
	)

	return nil
}
